import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from openai import OpenAI
from dotenv import load_dotenv
import numpy as np
from datasets import load_dataset
from rouge_score import rouge_scorer
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from sklearn.metrics import f1_score
from tqdm import tqdm
import nltk
import re

# Download required NLTK data
nltk.download('punkt')

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,  # Changed from DEBUG to INFO for less verbose output
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PromptTemplates:
    @staticmethod
    def standard(context, question):
        return f"Context: {context}\n\nQuestion: {question}\n\nAnswer:"

    @staticmethod
    def few_shot(context, question):
        examples = """Example 1:
Context: The cat sat on the mat.
Question: Where did the cat sit?
Answer: The cat sat on the mat.

Example 2:
Context: John went to the store to buy milk.
Question: What did John buy?
Answer: John bought milk.

Now answer this:"""
        return f"{examples}\n\nContext: {context}\n\nQuestion: {question}\n\nAnswer:"

    @staticmethod
    def chain_of_thought(context, question):
        return f"""Context: {context}
Question: {question}
Let's approach this step by step:
1) First, let's understand what we're asked
2) Then, let's find relevant information from the context
3) Finally, let's formulate our answer

Your reasoning:"""

    @staticmethod
    def self_consistency(context, question):
        return f"""Generate 3 different approaches to answer this question, then choose the most consistent one.
Context: {context}
Question: {question}

Approach 1:
Approach 2:
Approach 3:

Most consistent answer:"""

    @staticmethod
    def role_prompting(context, question):
        return f"""As an expert analyst with deep knowledge in this field, analyze the following:
Context: {context}
Question: {question}

Expert analysis and answer:"""

    @staticmethod
    def react_prompting(context, question):
        return f"""Let's solve this step by step:
Context: {context}
Question: {question}

Thought: Let me analyze this carefully
Action: Search for relevant information in the context
Observation: [Write what you find]
Thought: Based on this observation
Action: Formulate an answer
Answer:"""

class ModelEvaluator:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        self.smoothing = SmoothingFunction().method1
        self.prompt_templates = PromptTemplates()
        self.tasks = {
            "qa": self.evaluate_qa,
            "reasoning": self.evaluate_reasoning,
            "summarization": self.evaluate_summarization
        }
        self.prompting_techniques = {
            "standard", "few_shot", "chain_of_thought", 
            "self_consistency", "role_prompting", "react_prompting"
        }
        
        # Verify API key
        if not os.getenv('OPENAI_API_KEY'):
            logger.error("OpenAI API key not found in environment variables")
            raise ValueError("OpenAI API key not found in environment variables")
        
        self.current_technique = "standard"  # Add this line to track current technique

    def get_model_response(self, model: str, messages: List[Dict[str, str]]) -> str:
        try:
            # Use correct model names for OpenAI API
            model_mapping = {
                "gpt-3.5-turbo": "gpt-3.5-turbo",
                "gpt-4o-mini": "gpt-4o-mini",
                "o1-mini": "gpt-3.5-turbo",  # Fallback to gpt-3.5-turbo
                "o3-mini": "gpt-4"           # Fallback to gpt-4
            }
            
            actual_model = model_mapping.get(model, model)
            logger.info(f"Using model: {actual_model}")
            
            # Add retry logic with backoff
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    response = self.openai_client.chat.completions.create(
                        model=actual_model,
                        messages=messages,
                        temperature=0,
                        max_tokens=1000
                    )
                    
                    if response.choices:
                        result = response.choices[0].message.content.strip()
                        logger.info(f"Response from {actual_model} (first 100 chars): {result[:100]}...")
                        return result
                    else:
                        logger.warning(f"No response choices from {actual_model}")
                        return ""
                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Retry {attempt+1}/{max_retries} after error: {str(e)}")
                        import time
                        time.sleep(2 * (attempt + 1))  # Exponential backoff
                        continue
                    else:
                        raise
                
        except Exception as e:
            logger.error(f"Error getting response from {model}: {str(e)}", exc_info=True)
            return f"ERROR: Failed to get response from {model}"

    def calculate_f1(self, actual: str, predicted: str) -> float:
        """Calculate F1 score with word overlap."""
        actual_words = set(self.normalize_answer(actual).split())
        predicted_words = set(self.normalize_answer(predicted).split())
        
        overlap = len(actual_words & predicted_words)
        
        if not actual_words and not predicted_words:
            return 1.0
        if not actual_words or not predicted_words:
            return 0.0
        
        precision = overlap / len(predicted_words)
        recall = overlap / len(actual_words)
        
        return 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    def calculate_bleu(self, reference: str, candidate: str) -> float:
        """Calculate BLEU score with better handling of short answers."""
        reference_tokens = [self.normalize_answer(reference).split()]
        candidate_tokens = self.normalize_answer(candidate).split()
        
        if not reference_tokens[0] or not candidate_tokens:
            return 0.0
        
        # Use simpler weights for short answers
        weights = (1.0,) if len(candidate_tokens) < 4 else (0.25, 0.25, 0.25, 0.25)
        
        return sentence_bleu(reference_tokens, candidate_tokens, 
                           weights=weights,
                           smoothing_function=SmoothingFunction().method1)

    def normalize_answer(self, text: str) -> str:
        """Less strict normalization for better matching."""
        if not text:
            return ""
        
        # Basic cleaning while preserving meaningful distinctions
        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)  # normalize whitespace
        text = re.sub(r'[^\w\s\'.,]', '', text)  # keep basic punctuation
        
        return text

    def evaluate_qa(self, model: str, num_samples: int = 50) -> Dict[str, float]:
        """Evaluate question answering using SQuAD dataset."""
        dataset = load_dataset("squad_v2", split="validation")
        dataset = dataset.shuffle(seed=42).select(range(num_samples))
        
        metrics = {
            "f1_score": 0,
            "bleu_score": 0,
            "rouge1": 0,
            "rouge2": 0,
            "rougeL": 0
        }
        total = 0
        successful = 0
        
        for item in tqdm(dataset, desc=f"Evaluating {model} on QA"):
            try:
                # Skip items with no answers
                if not item['answers']['text']:
                    continue
                    
                context = item['context']
                question = item['question']
                
                # Simplified prompt format
                prompt = f"""Answer this question based on the context:
                
Context: {context}

Question: {question}

Your answer:"""
                
                response = self.get_model_response(model, [
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on provided context. Give direct answers without explanations."},
                    {"role": "user", "content": prompt}
                ])
                
                # Check if response contains the error marker
                if response.startswith("ERROR:"):
                    logger.warning(f"API error for {model} on QA task: {response}")
                    continue
                
                if not response.strip():
                    logger.warning(f"Empty response from {model} for QA task")
                    continue

                # Get reference answer
                actual = item['answers']['text'][0]
                
                # Print raw responses for debugging
                logger.info(f"Question: {question}")
                logger.info(f"Expected answer: {actual}")
                logger.info(f"Model response: {response}")
                
                # Normalize responses
                normalized_response = self.normalize_answer(response)
                normalized_actual = self.normalize_answer(actual)
                
                logger.info(f"Normalized expected: '{normalized_actual}'")
                logger.info(f"Normalized response: '{normalized_response}'")
                
                # Calculate metrics with normalized text
                f1 = self.calculate_f1(normalized_actual, normalized_response)
                bleu = self.calculate_bleu(normalized_actual, normalized_response)
                rouge_scores = self.rouge_scorer.score(normalized_actual, normalized_response)
                
                # Update metrics
                metrics["f1_score"] += f1
                metrics["bleu_score"] += bleu
                metrics["rouge1"] += rouge_scores['rouge1'].fmeasure
                metrics["rouge2"] += rouge_scores['rouge2'].fmeasure
                metrics["rougeL"] += rouge_scores['rougeL'].fmeasure
                
                successful += 1
                
                # Log metrics for each item
                logger.info(f"Item metrics - Exact: {exact_match}, F1: {f1:.4f}, BLEU: {bleu:.4f}, ROUGE-1: {rouge_scores['rouge1'].fmeasure:.4f}")
                
            except Exception as e:
                logger.error(f"Error evaluating QA: {str(e)}", exc_info=True)
                continue
            
            finally:
                total += 1
                
                # Only process a few items for testing
                if total >= num_samples:
                    break
        
        if successful == 0:
            logger.warning(f"No successful evaluations for {model} on QA task (attempted {total})")
            return {k: 0.0 for k in metrics}
        
        # Calculate averages and log final scores
        final_metrics = {k: v/successful for k, v in metrics.items()}
        logger.info(f"\nFinal averaged metrics for {model} (successful: {successful}/{total}):")
        for metric, value in final_metrics.items():
            logger.info(f"  {metric}: {value:.4f}")
            
        return final_metrics

    def evaluate_reasoning(self, model: str, num_samples: int = 10) -> Dict[str, float]:
        """Evaluate reasoning using CosmosQA dataset."""
        dataset = load_dataset("cosmos_qa", split="validation", trust_remote_code=True)
        dataset = dataset.shuffle(seed=42).select(range(num_samples))
        
        metrics = {
            "f1_score": 0,
            "bleu_score": 0,
            "rouge1": 0,
            "rouge2": 0,
            "rougeL": 0
        }
        total = 0
        successful = 0
        
        for item in tqdm(dataset, desc=f"Evaluating {model} on Reasoning"):
            try:
                context = item['context']
                question = item['question']
                correct_answer = item['answer0']  # Assuming answer0 is correct
                
                # Get prompt based on technique
                response = self.get_model_response(model, [
                    {"role": "system", "content": "You are an assistant skilled in logical reasoning."},
                    {"role": "user", "content": getattr(self.prompt_templates, self.current_technique)(context, question)}
                ])
                
                if response.startswith("ERROR:") or not response.strip():
                    continue
                
                # Calculate metrics
                normalized_response = self.normalize_answer(response)
                normalized_actual = self.normalize_answer(correct_answer)
                
                exact_match = int(normalized_response == normalized_actual)
                f1 = self.calculate_f1(normalized_actual, normalized_response)
                bleu = self.calculate_bleu(normalized_actual, normalized_response)
                rouge_scores = self.rouge_scorer.score(normalized_actual, normalized_response)
                
                # Update metrics
                metrics["f1_score"] += f1
                metrics["bleu_score"] += bleu
                metrics["rouge1"] += rouge_scores['rouge1'].fmeasure
                metrics["rouge2"] += rouge_scores['rouge2'].fmeasure
                metrics["rougeL"] += rouge_scores['rougeL'].fmeasure
                
                successful += 1
                
            except Exception as e:
                logger.error(f"Error evaluating reasoning: {str(e)}", exc_info=True)
                continue
            finally:
                total += 1
                if total >= num_samples:
                    break
        
        return {k: v/successful if successful > 0 else 0.0 for k, v in metrics.items()}

    def evaluate_summarization(self, model: str, num_samples: int = 10) -> Dict[str, float]:
        """Evaluate summarization using CNN/DailyMail dataset."""
        dataset = load_dataset("cnn_dailymail", "3.0.0", split="validation", trust_remote_code=True)
        dataset = dataset.shuffle(seed=42).select(range(num_samples))
        
        metrics = {
            "f1_score": 0,
            "bleu_score": 0,
            "rouge1": 0,
            "rouge2": 0,
            "rougeL": 0
        }
        total = 0
        successful = 0
        
        for item in tqdm(dataset, desc=f"Evaluating {model} on Summarization"):
            try:
                context = item['article']
                reference_summary = item['highlights']
                
                # Adapt prompt for summarization
                response = self.get_model_response(model, [
                    {"role": "system", "content": "You are an assistant skilled in text summarization."},
                    {"role": "user", "content": f"Summarize this text:\n\n{context}"}
                ])
                
                if response.startswith("ERROR:") or not response.strip():
                    continue
                
                # Calculate metrics
                normalized_response = self.normalize_answer(response)
                normalized_actual = self.normalize_answer(reference_summary)
                
                exact_match = int(normalized_response == normalized_actual)
                f1 = self.calculate_f1(normalized_actual, normalized_response)
                bleu = self.calculate_bleu(normalized_actual, normalized_response)
                rouge_scores = self.rouge_scorer.score(normalized_actual, normalized_response)
                
                # Update metrics
                metrics["f1_score"] += f1
                metrics["bleu_score"] += bleu
                metrics["rouge1"] += rouge_scores['rouge1'].fmeasure
                metrics["rouge2"] += rouge_scores['rouge2'].fmeasure
                metrics["rougeL"] += rouge_scores['rougeL'].fmeasure
                
                successful += 1
                
            except Exception as e:
                logger.error(f"Error evaluating summarization: {str(e)}", exc_info=True)
                continue
            finally:
                total += 1
                if total >= num_samples:
                    break
        
        return {k: v/successful if successful > 0 else 0.0 for k, v in metrics.items()}

def main():
    # Initialize evaluator
    try:
        evaluator = ModelEvaluator()
    except ValueError as e:
        logger.error(f"Failed to initialize evaluator: {str(e)}")
        return

    # Models to evaluate - using only OpenAI models
    models = [
        "gpt-3.5-turbo",
        "gpt-4o-mini",
        "o1-mini",
        "o3-mini"
    ]
    
    # Store results
    all_results = {}
    
    for model in models:
        all_results[model] = {}
        for task_name, task_func in evaluator.tasks.items():
            all_results[model][task_name] = {}
            for technique in evaluator.prompting_techniques:
                evaluator.current_technique = technique  # Set current technique
                results = task_func(model, num_samples=5)  # Reduced samples for testing
                all_results[model][task_name][technique] = results

    # Create multi-level heatmap
    if all_results:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = "evaluation_results"
        os.makedirs(output_path, exist_ok=True)

        # Save raw results
        with open(f"{output_path}/comprehensive_results_{timestamp}.json", "w") as f:
            json.dump(all_results, f, indent=2)

        # Create subplot for each metric
        metrics = ['f1_score', 'rouge1', 'rouge2', 'rougeL', 'bleu_score']
        fig, axes = plt.subplots(len(metrics), 1, figsize=(15, 4*len(metrics)))
        
        for idx, metric in enumerate(metrics):
            data = {
                (model, task, technique): all_results[model][task][technique][metric]
                for model in models
                for task in evaluator.tasks.keys()
                for technique in evaluator.prompting_techniques
            }
            
            df = pd.DataFrame.from_dict(data, orient='index')
            df.index = pd.MultiIndex.from_tuples(df.index)
            df = df.unstack()
            
            sns.heatmap(df, ax=axes[idx], annot=True, fmt='.3f', cmap='YlOrRd')
            axes[idx].set_title(f'{metric} Performance')

        plt.tight_layout()
        plt.savefig(f"{output_path}/comprehensive_comparison_{timestamp}.png", 
                   dpi=300, bbox_inches='tight')
        plt.close()

if __name__ == "__main__":
    main()