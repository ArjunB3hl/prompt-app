import os
import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Any
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from openai import OpenAI
from anthropic import Anthropic
from dotenv import load_dotenv
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from rouge_score import rouge_scorer
import nltk
import re

# Download required NLTK data
nltk.download('punkt', quiet=True)

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelComparisonBenchmark:
    def __init__(self):
        # Initialize API clients
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.anthropic_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
        # Verify API keys
        if not os.getenv('OPENAI_API_KEY'):
            logger.error("OpenAI API key not found in environment variables")
            raise ValueError("OpenAI API key not found in environment variables")
            
        if not os.getenv('ANTHROPIC_API_KEY'):
            logger.error("Anthropic API key not found in environment variables")
            raise ValueError("Anthropic API key not found in environment variables")

        # Initialize ROUGE scorer
        self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        
        # Define prompting techniques (reduced set)
        self.prompting_techniques = [
            "standard",
            "few_shot",
            "chain_of_thought",
        ]

        # Define evaluation tasks (reduced examples)
        self.tasks = {
            "qa": [
                {"question": "What is the capital of France?", "answer": "Paris"},
                {"question": "What is the largest planet in our solar system?", "answer": "Jupiter"}
            ],
            "reasoning": [
                {"question": "If a shirt costs $25 and is on sale for 20% off, what is the sale price?", "answer": "$20"},
                {"question": "If x + y = 10 and x - y = 4, what is the value of x?", "answer": "7"}
            ],
            "summarization": [
                {"text": "The International Space Station (ISS) is a modular space station in low Earth orbit. It is a multinational collaborative project involving five participating space agencies: NASA (United States), Roscosmos (Russia), JAXA (Japan), ESA (Europe), and CSA (Canada). The ownership and use of the space station is established by intergovernmental treaties and agreements. The station serves as a microgravity and space environment research laboratory in which scientific research is conducted in astrobiology, astronomy, meteorology, physics, and other fields.", 
                 "summary": "The ISS is a multinational space station in low Earth orbit that serves as a microgravity research lab for scientific studies across various fields."}
            ]
        }

    def get_model_response(self, model: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Route to appropriate API based on model name."""
        if model.startswith("claude"):
            return self.get_anthropic_response(model, messages)
        else:
            return self.get_openai_response(model, messages)

    def get_openai_response(self, model: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Get response from OpenAI model with metrics."""
        start_time = time.time()
        
        try:
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0,
                max_tokens=1024
            )
            
            result = response.choices[0].message.content
            
            # Get token counts
            input_tokens = response.usage.prompt_tokens
            output_tokens = response.usage.completion_tokens
            
            elapsed_time = time.time() - start_time
            
            return {
                "response": result,
                "time_seconds": elapsed_time,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens
            }
                
        except Exception as e:
            logger.error(f"Error getting response from {model}: {str(e)}")
            return {
                "response": f"ERROR: {str(e)}",
                "time_seconds": time.time() - start_time,
                "input_tokens": 0,
                "output_tokens": 0
            }

    def get_anthropic_response(self, model: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Get response from Anthropic model with metrics."""
        start_time = time.time()
        
        try:
            # Extract system message and user message
            system_message = next((m["content"] for m in messages if m["role"] == "system"), "")
            user_messages = [m for m in messages if m["role"] == "user"]
            
            if not user_messages:
                return {
                    "response": "ERROR: No user message provided",
                    "time_seconds": 0,
                    "input_tokens": 0,
                    "output_tokens": 0
                }
                
            # For Claude, we need the last user message
            user_message = user_messages[-1]["content"]
            
            response = self.anthropic_client.messages.create(
                model=model,
                system=system_message,
                messages=[{"role": "user", "content": user_message}],
                max_tokens=1024,
                temperature=0
            )
            
            result = response.content[0].text
            
            # Get token counts
            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            
            elapsed_time = time.time() - start_time
            
            return {
                "response": result,
                "time_seconds": elapsed_time,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens
            }
                
        except Exception as e:
            logger.error(f"Error getting response from {model}: {str(e)}")
            return {
                "response": f"ERROR: {str(e)}",
                "time_seconds": time.time() - start_time,
                "input_tokens": 0,
                "output_tokens": 0
            }

    def normalize_answer(self, text: str) -> str:
        """Normalize text for comparison."""
        if not text:
            return ""
        # Convert to lowercase, remove punctuation and extra whitespace
        text = text.lower()
        text = re.sub(r'[^\w\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def calculate_f1(self, reference: str, prediction: str) -> float:
        """Calculate F1 score between reference and prediction."""
        if not reference or not prediction:
            return 0.0
            
        reference_tokens = set(self.normalize_answer(reference).split())
        prediction_tokens = set(self.normalize_answer(prediction).split())
        
        # Calculate precision, recall, and F1
        common_tokens = reference_tokens.intersection(prediction_tokens)
        
        if not common_tokens:
            return 0.0
            
        precision = len(common_tokens) / len(prediction_tokens)
        recall = len(common_tokens) / len(reference_tokens)
        
        if precision + recall == 0:
            return 0.0
            
        f1 = 2 * precision * recall / (precision + recall)
        return f1

    def calculate_bleu(self, reference: str, prediction: str) -> float:
        """Calculate BLEU score between reference and prediction."""
        if not reference or not prediction:
            return 0.0
            
        reference_tokens = self.normalize_answer(reference).split()
        prediction_tokens = self.normalize_answer(prediction).split()
        
        if not reference_tokens or not prediction_tokens:
            return 0.0
            
        # Use smoothing function to avoid zero scores
        smoothie = SmoothingFunction().method1
        return sentence_bleu([reference_tokens], prediction_tokens, smoothing_function=smoothie)

    def get_prompt_with_technique(self, technique: str, task_type: str, item: Dict[str, str]) -> List[Dict[str, str]]:
        """Generate prompt based on technique and task."""
        if task_type == "qa" or task_type == "reasoning":
            question = item["question"]
            
            if technique == "standard":
                return [
                    {"role": "system", "content": "You are a helpful assistant that provides accurate, concise answers."},
                    {"role": "user", "content": question}
                ]
            elif technique == "few_shot":
                examples = "Example 1: Q: What is the capital of Spain? A: Madrid\n\n"
                examples += "Example 2: Q: Who wrote Hamlet? A: William Shakespeare\n\n"
                return [
                    {"role": "system", "content": "You are a helpful assistant that provides accurate, concise answers."},
                    {"role": "user", "content": f"{examples}Q: {question}\nA:"}
                ]
            elif technique == "chain_of_thought":
                return [
                    {"role": "system", "content": "You are a helpful assistant that thinks step by step."},
                    {"role": "user", "content": f"Question: {question}\n\nLet's think through this step by step:"}
                ]
        
        elif task_type == "summarization":
            text = item["text"]
            
            if technique == "standard":
                return [
                    {"role": "system", "content": "You are a helpful assistant that provides concise summaries."},
                    {"role": "user", "content": f"Please summarize the following text:\n\n{text}"}
                ]
            elif technique == "chain_of_thought":
                return [
                    {"role": "system", "content": "You are a helpful assistant that thinks step by step."},
                    {"role": "user", "content": f"Please summarize the following text step by step:\n\n{text}"}
                ]
        
        # Default fallback
        return [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": f"Task: {task_type}\n\nContent: {item.get('question', item.get('text', ''))}"}
        ]

    def evaluate_task(self, model: str, task_type: str, technique: str) -> Dict[str, float]:
        """Evaluate model on a specific task with a specific technique."""
        metrics = {
            "f1_score": 0.0,
            "bleu_score": 0.0,
            "rouge1": 0.0,
            "rouge2": 0.0,
            "rougeL": 0.0
        }
        
        successful = 0
        
        for item in self.tasks[task_type]:
            try:
                # Generate prompt
                messages = self.get_prompt_with_technique(technique, task_type, item)
                
                # Get model response
                response_data = self.get_model_response(model, messages)
                prediction = response_data["response"]
                
                if "ERROR" in prediction:
                    logger.warning(f"Error in model response: {prediction}")
                    continue
                
                # Get reference answer
                reference = item.get("answer", item.get("summary", ""))
                
                # Calculate metrics
                f1 = self.calculate_f1(reference, prediction)
                bleu = self.calculate_bleu(reference, prediction)
                rouge_scores = self.rouge_scorer.score(reference, prediction)
                
                # Accumulate metrics
                metrics["f1_score"] += f1
                metrics["bleu_score"] += bleu
                metrics["rouge1"] += rouge_scores['rouge1'].fmeasure
                metrics["rouge2"] += rouge_scores['rouge2'].fmeasure
                metrics["rougeL"] += rouge_scores['rougeL'].fmeasure
                
                successful += 1
                
            except Exception as e:
                logger.error(f"Error evaluating {task_type} with {technique}: {str(e)}")
                continue
        
        # Average the metrics
        if successful > 0:
            for key in metrics:
                metrics[key] /= successful
        
        return metrics

    def evaluate_model(self, model: str) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Evaluate model across all tasks and techniques."""
        results = {}
        
        for task_type in self.tasks:
            results[task_type] = {}
            
            for technique in self.prompting_techniques:
                logger.info(f"Evaluating {model} on {task_type} with {technique} technique")
                metrics = self.evaluate_task(model, task_type, technique)
                results[task_type][technique] = metrics
        
        return results

def main():
    # Initialize benchmark
    benchmark = ModelComparisonBenchmark()
    
    # Models to evaluate (reduced set)
    models = [
        "gpt-3.5-turbo",
        "claude-3-haiku-20240307"
    ]
    
    # Store results
    all_results = {}
    
    for model in models:
        logger.info(f"\n=== Evaluating model: {model} ===")
        try:
            results = benchmark.evaluate_model(model)
            all_results[model] = results
            logger.info(f"Successfully evaluated {model}")
            
        except Exception as e:
            logger.error(f"Error evaluating {model}: {str(e)}")
            continue
    
    if all_results:
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = "evaluation_results"
        os.makedirs(output_path, exist_ok=True)
        
        # Save raw results to JSON
        results_file = f"{output_path}/comparison_results_{timestamp}.json"
        with open(results_file, "w") as f:
            json.dump(all_results, f, indent=2)
        logger.info(f"Saved raw results to: {results_file}")
        
        # Create heatmap visualizations for each metric
        metrics = ["f1_score", "bleu_score", "rouge1", "rouge2", "rougeL"]
        
        for metric in metrics:
            plt.figure(figsize=(12, 8))
            
            # Prepare data for heatmap
            rows = []
            for model in models:
                for task_type in benchmark.tasks:
                    for technique in benchmark.prompting_techniques:
                        try:
                            score = all_results[model][task_type][technique][metric]
                            rows.append({
                                "model": f"{model}-{task_type}",
                                "technique": f"{technique}",
                                "score": score
                            })
                        except KeyError:
                            continue
            
            # Create DataFrame
            df = pd.DataFrame(rows)
            pivot_df = df.pivot(index="model", columns="technique", values="score")
            
            # Create heatmap
            ax = sns.heatmap(pivot_df, annot=True, cmap="YlOrRd", fmt=".3f", vmin=0, vmax=1)
            plt.title(f'{metric} Performance')
            plt.tight_layout()
            
            # Save heatmap
            heatmap_file = f"{output_path}/{metric}_comparison_{timestamp}.png"
            plt.savefig(heatmap_file, dpi=300, bbox_inches='tight')
            plt.close()
            logger.info(f"Saved {metric} heatmap to: {heatmap_file}")
        
        # Print summary
        logger.info("\n=== Comparison Summary ===")
        for metric in metrics:
            logger.info(f"\n{metric.upper()} Scores:")
            for model in models:
                logger.info(f"  {model}:")
                for task_type in benchmark.tasks:
                    avg_score = sum(all_results[model][task_type][t][metric] for t in benchmark.prompting_techniques) / len(benchmark.prompting_techniques)
                    logger.info(f"    {task_type}: {avg_score:.4f}")
    
    else:
        logger.error("No results were generated.")

if __name__ == "__main__":
    main() 