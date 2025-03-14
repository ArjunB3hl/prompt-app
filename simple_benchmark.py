import os
import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Any
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleModelEvaluator:
    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Verify API key
        if not os.getenv('OPENAI_API_KEY'):
            logger.error("OpenAI API key not found in environment variables")
            raise ValueError("OpenAI API key not found in environment variables")

        # Define prompting techniques
        self.prompting_techniques = [
            "standard",
            "few_shot",
            "chain_of_thought",
            "self_consistency",
            "role",
            "react"
        ]
            
        # Define evaluation tasks
        self.tasks = {
            "factual_qa": [
                {"question": "What is the capital of France?", "answer": "Paris"},
                {"question": "Who wrote 'Romeo and Juliet'?", "answer": "William Shakespeare"},
                {"question": "What is the chemical symbol for gold?", "answer": "Au"},
                {"question": "What year did World War II end?", "answer": "1945"},
                {"question": "What is the largest planet in our solar system?", "answer": "Jupiter"}
            ],
            "reasoning": [
                {"question": "If a shirt costs $25 and is on sale for 20% off, what is the sale price?", "answer": "$20"},
                {"question": "If a train travels at 60 miles per hour, how far will it travel in 2.5 hours?", "answer": "150 miles"},
                {"question": "If x + y = 10 and x - y = 4, what is the value of x?", "answer": "7"},
                {"question": "A box contains 3 red balls, 4 green balls, and 5 blue balls. What is the probability of drawing a red ball?", "answer": "0.25"},
                {"question": "If today is Tuesday, what day will it be 100 days from now?", "answer": "Thursday"}
            ],
            "summarization": [
                {"text": "The International Space Station (ISS) is a modular space station in low Earth orbit. It is a multinational collaborative project involving five participating space agencies: NASA (United States), Roscosmos (Russia), JAXA (Japan), ESA (Europe), and CSA (Canada). The ownership and use of the space station is established by intergovernmental treaties and agreements. The station serves as a microgravity and space environment research laboratory in which scientific research is conducted in astrobiology, astronomy, meteorology, physics, and other fields.", 
                 "expected_elements": ["space station", "low Earth orbit", "multinational", "research laboratory", "microgravity"]},
                {"text": "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals. The term 'artificial intelligence' is often used to describe machines (or computers) that mimic 'cognitive' functions that humans associate with the human mind, such as 'learning' and 'problem solving'.", 
                 "expected_elements": ["machine intelligence", "intelligent agents", "environment perception", "cognitive functions", "learning"]},
                {"text": "Climate change refers to long-term shifts in temperatures and weather patterns. These shifts may be natural, but since the 1800s, human activities have been the main driver of climate change, primarily due to the burning of fossil fuels like coal, oil, and gas, which produces heat-trapping gases. The main sources of greenhouse gas emissions are electricity production, agriculture, industry, transportation, and buildings. Mitigation strategies include using renewable energy sources, improving energy efficiency, and changing consumption patterns.",
                 "expected_elements": ["long-term shifts", "human activities", "fossil fuels", "greenhouse gas", "renewable energy"]},
                {"text": "Quantum computing is a type of computation that harnesses the collective properties of quantum states, such as superposition, interference, and entanglement, to perform calculations. The devices that perform quantum computations are known as quantum computers. Though current quantum computers are too small to outperform usual (classical) computers for practical applications, they are believed to be capable of solving certain computational problems, such as integer factorization, substantially faster than classical computers.",
                 "expected_elements": ["quantum states", "superposition", "entanglement", "quantum computers", "computational problems"]},
                {"text": "The human genome is the complete set of nucleic acid sequences for humans, encoded as DNA within the 23 chromosome pairs in cell nuclei and in a small DNA molecule found within individual mitochondria. The Human Genome Project produced the first complete sequences of individual human genomes. As of 2022, thousands of human genomes have been completely sequenced, and many more have been mapped at lower levels of resolution. The resulting data are used worldwide in biomedical science, anthropology, forensics, and other branches of science.",
                 "expected_elements": ["DNA", "chromosome pairs", "Human Genome Project", "sequenced", "biomedical science"]}
            ],
            "coding": [
                {"prompt": "Write a Python function to check if a string is a palindrome", 
                 "expected_elements": ["function", "palindrome", "string", "reverse", "comparison"]},
                {"prompt": "Write a JavaScript function to find the maximum number in an array", 
                 "expected_elements": ["function", "array", "maximum", "loop", "comparison"]},
                {"prompt": "Write a Python function to calculate the factorial of a number", 
                 "expected_elements": ["function", "factorial", "recursion", "multiplication", "return"]},
                {"prompt": "Create a SQL query to find the top 5 customers who spent the most money", 
                 "expected_elements": ["SELECT", "FROM", "ORDER BY", "DESC", "LIMIT"]},
                {"prompt": "Write a Python function to check if a number is prime", 
                 "expected_elements": ["function", "prime", "divisible", "loop", "return"]},
                {"prompt": "Create a simple HTML form with name, email, and submit button", 
                 "expected_elements": ["form", "input", "type", "submit", "button"]}
            ]
        }

        # Define few-shot examples
        self.few_shot_examples = {
            "factual_qa": [
                {"question": "What is the capital of Spain?", "answer": "Madrid"},
                {"question": "Who wrote 'Hamlet'?", "answer": "William Shakespeare"},
                {"question": "What is the chemical symbol for silver?", "answer": "Ag"}
            ],
            "reasoning": [
                {"question": "If a book costs $30 and is on sale for 10% off, what is the sale price?", 
                 "answer": "$27",
                 "explanation": "To find 10% off $30: $30 × 0.10 = $3 discount, then $30 - $3 = $27"},
                {"question": "If a car travels at 50 miles per hour, how far will it travel in 2 hours?", 
                 "answer": "100 miles",
                 "explanation": "Distance = Speed × Time, so 50 mph × 2 hours = 100 miles"}
            ],
            "summarization": [
                {"text": "The Great Wall of China is an ancient series of walls and fortifications located in northern China, built around 500 years ago. Contrary to popular belief, the Great Wall is not a single continuous wall but rather a collection of walls built by different dynasties. The primary purpose was to protect Chinese states from nomadic invasions.",
                 "summary": "The Great Wall of China is a series of defensive walls in northern China built 500 years ago by various dynasties to protect against nomadic invasions."},
                {"text": "Photosynthesis is the process by which plants convert light energy into chemical energy. This process occurs in the chloroplasts of plant cells, specifically using chlorophyll pigments. The process requires sunlight, carbon dioxide, and water, and produces glucose and oxygen as byproducts.",
                 "summary": "Photosynthesis is a biological process where plants use chlorophyll to convert sunlight, CO2, and water into glucose and oxygen."}
            ]
        }

    def get_model_response(self, model: str, messages: List[Dict[str, str]]) -> str:
        """Get response from a model with retry logic."""
        try:
            # Map model names to actual OpenAI model names
            model_mapping = {
                "gpt-3.5-turbo": "gpt-3.5-turbo",
                "gpt-4o-mini": "gpt-4o-mini",
                "o1-mini": "gpt-3.5-turbo",  # Fallback
                "o3-mini": "gpt-4"           # Fallback
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
                        return result
                    else:
                        logger.warning(f"No response choices from {actual_model}")
                        return ""
                except Exception as e:
                    if attempt < max_retries - 1:
                        logger.warning(f"Retry {attempt+1}/{max_retries} after error: {str(e)}")
                        time.sleep(2 * (attempt + 1))  # Exponential backoff
                        continue
                    else:
                        raise
                
        except Exception as e:
            logger.error(f"Error getting response from {model}: {str(e)}")
            return f"ERROR: Failed to get response from {model}"

    def get_few_shot_prompt(self, task_type: str, question: str) -> List[Dict[str, str]]:
        """Generate few-shot prompt with examples."""
        messages = [
            {"role": "system", "content": "You are a helpful assistant that answers questions accurately."}
        ]
        
        # Add few-shot examples
        if task_type == "summarization":
            messages = [
                {"role": "system", "content": "You are a helpful assistant that creates concise and accurate summaries while preserving key information."}
            ]
            for example in self.few_shot_examples[task_type]:
                messages.extend([
                    {"role": "user", "content": f"Please summarize the following text:\n\n{example['text']}"},
                    {"role": "assistant", "content": example['summary']}
                ])
        else:
            for example in self.few_shot_examples[task_type]:
                messages.extend([
                    {"role": "user", "content": example["question"]},
                    {"role": "assistant", "content": example["answer"]}
                ])
        
        # Add the actual question
        messages.append({"role": "user", "content": question})
        return messages

    def get_chain_of_thought_prompt(self, task_type: str, question: str) -> List[Dict[str, str]]:
        """Generate chain-of-thought prompt."""
        return [
            {"role": "system", "content": "You are a helpful assistant that solves problems step by step. "
                                        "Show your reasoning before giving the final answer."},
            {"role": "user", "content": f"Let's solve this step by step:\n\n{question}"}
        ]

    def get_self_consistency_prompt(self, task_type: str, question: str) -> List[Dict[str, str]]:
        """Generate self-consistency prompt."""
        return [
            {"role": "system", "content": "You are a helpful assistant that solves problems multiple ways. "
                                        "Provide three different approaches to solve the problem, then give your final answer."},
            {"role": "user", "content": f"Solve this problem using three different approaches:\n\n{question}"}
        ]

    def get_role_prompt(self, task_type: str, question: str) -> List[Dict[str, str]]:
        """Generate role-specific prompt."""
        roles = {
            "factual_qa": "You are an expert researcher with extensive knowledge in various fields.",
            "reasoning": "You are a mathematics professor who excels at breaking down complex problems.",
        }
        return [
            {"role": "system", "content": roles.get(task_type, "You are a highly knowledgeable expert.")},
            {"role": "user", "content": question}
        ]

    def get_react_prompt(self, task_type: str, question: str) -> List[Dict[str, str]]:
        """Generate ReAct (Reasoning + Acting) prompt."""
        return [
            {"role": "system", "content": "You are a helpful assistant that follows the ReAct framework: "
                                        "1. Thought: Analyze what is being asked\n"
                                        "2. Action: Determine what needs to be done\n"
                                        "3. Observation: Note relevant information\n"
                                        "4. Answer: Provide the final answer\n"
                                        "Follow this framework for each question."},
            {"role": "user", "content": question}
        ]

    def evaluate_with_technique(self, model: str, task_type: str, technique: str) -> Dict[str, float]:
        """Evaluate model using a specific prompting technique."""
        correct = 0
        total = len(self.tasks[task_type])
        
        prompt_generators = {
            "standard": lambda task_type, q: [
                {"role": "system", "content": "You are a helpful assistant."}, 
                {"role": "user", "content": q}
            ],
            "few_shot": self.get_few_shot_prompt,
            "chain_of_thought": self.get_chain_of_thought_prompt,
            "self_consistency": self.get_self_consistency_prompt,
            "role": self.get_role_prompt,
            "react": self.get_react_prompt
        }

        for item in self.tasks[task_type]:
            try:
                if task_type == "summarization":
                    text = item["text"]
                    expected_elements = item["expected_elements"]
                    
                    messages = prompt_generators[technique](task_type, f"Please summarize the following text:\n\n{text}")
                    response = self.get_model_response(model, messages)
                    
                    if response.startswith("ERROR:"):
                        logger.warning(f"API error for {model} using {technique} on {task_type}: {response}")
                        continue
                    
                    # Count how many expected elements are present in the response
                    normalized_response = response.lower().strip()
                    elements_found = sum(1 for element in expected_elements if element.lower() in normalized_response)
                    accuracy = elements_found / len(expected_elements)
                    
                    logger.info(f"\nTechnique: {technique}")
                    logger.info(f"Text: {text[:100]}...")
                    logger.info(f"Expected elements: {expected_elements}")
                    logger.info(f"Response: {normalized_response[:200]}...")
                    logger.info(f"Elements found: {elements_found}/{len(expected_elements)}")
                    
                    correct += accuracy
                else:
                    question = item["question"]
                    expected_answer = item["answer"].lower()
                    
                    messages = prompt_generators[technique](task_type, question)
                    response = self.get_model_response(model, messages)
                    
                    if response.startswith("ERROR:"):
                        logger.warning(f"API error for {model} using {technique} on {task_type}: {response}")
                        continue
                    
                    normalized_response = response.lower().strip()
                    is_correct = expected_answer in normalized_response
                    
                    logger.info(f"\nTechnique: {technique}")
                    logger.info(f"Question: {question}")
                    logger.info(f"Expected: {expected_answer}")
                    logger.info(f"Response: {normalized_response[:200]}...")
                    logger.info(f"Correct: {is_correct}")
                    
                    if is_correct:
                        correct += 1
            except Exception as e:
                logger.error(f"Error processing task: {str(e)}")
                continue

        accuracy = correct / total if total > 0 else 0
        logger.info(f"{technique.capitalize()} Accuracy for {model} on {task_type}: {accuracy:.4f}")
        
        return {f"{technique}_accuracy": accuracy}

    def evaluate_model(self, model: str) -> Dict[str, Dict[str, float]]:
        """Evaluate a model on all tasks using different prompting techniques."""
        results = {}
        
        for task_type in ["factual_qa", "reasoning", "summarization"]:
            task_results = {}
            logger.info(f"\nEvaluating {model} on {task_type}...")
            
            for technique in self.prompting_techniques:
                logger.info(f"\nUsing {technique} technique...")
                technique_results = self.evaluate_with_technique(model, task_type, technique)
                task_results.update(technique_results)
            
            results[task_type] = task_results
        
        return results

def main():
    # Initialize evaluator
    try:
        evaluator = SimpleModelEvaluator()
    except ValueError as e:
        logger.error(f"Failed to initialize evaluator: {str(e)}")
        return

    # Models to evaluate - including o1-mini and o3-mini
    models = [
        "gpt-3.5-turbo",
        "gpt-4o-mini",
        "o1-mini",
        "o3-mini"
    ]
    
    # Store results
    all_results = {}
    
    for model in models:
        logger.info(f"\n=== Evaluating model: {model} ===")
        try:
            results = evaluator.evaluate_model(model)
            all_results[model] = results
            logger.info(f"Successfully evaluated {model}")
            logger.info(f"Results for {model}: {json.dumps(results, indent=2)}")
            
        except Exception as e:
            logger.error(f"Error evaluating {model}: {str(e)}")
            continue
    
    if all_results:
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = "evaluation_results"
        os.makedirs(output_path, exist_ok=True)
        
        # Save raw results to JSON
        results_file = f"{output_path}/simple_results_{timestamp}.json"
        with open(results_file, "w") as f:
            json.dump(all_results, f, indent=2)
        logger.info(f"Saved raw results to: {results_file}")
        
        # Create visualizations
        # 1. Task-specific scores
        plt.figure(figsize=(15, 10))
        
        # Prepare data for visualization
        task_scores = {}
        for model, results in all_results.items():
            model_scores = {}
            for task, metrics in results.items():
                for metric, score in metrics.items():
                    model_scores[f"{task}_{metric}"] = score
            task_scores[model] = model_scores
        
        # Create DataFrame
        df = pd.DataFrame.from_dict(task_scores, orient='index')
        
        # Create heatmap
        sns.heatmap(df, annot=True, cmap='YlGnBu', fmt='.3f', vmin=0, vmax=1)
        plt.title('Model Performance by Task')
        plt.tight_layout()
        
        heatmap_file = f"{output_path}/simple_comparison_{timestamp}.png"
        plt.savefig(heatmap_file, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved heatmap to: {heatmap_file}")
        
        # 2. Overall performance
        plt.figure(figsize=(12, 8))
        
        # Calculate average score per model
        avg_scores = {}
        for model, results in all_results.items():
            scores = []
            for task, metrics in results.items():
                scores.extend(metrics.values())
            avg_scores[model] = sum(scores) / len(scores) if scores else 0
        
        # Create bar chart
        plt.bar(avg_scores.keys(), avg_scores.values())
        plt.title('Overall Model Performance')
        plt.ylabel('Average Score')
        plt.ylim(0, 1)
        
        for i, (model, score) in enumerate(avg_scores.items()):
            plt.text(i, score + 0.02, f'{score:.3f}', ha='center')
        
        barplot_file = f"{output_path}/simple_overall_{timestamp}.png"
        plt.savefig(barplot_file, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved bar plot to: {barplot_file}")
        
        # Print results in a formatted way
        logger.info("\n=== Final Evaluation Results ===")
        for model, results in all_results.items():
            logger.info(f"\n{model}:")
            for task, metrics in results.items():
                logger.info(f"  {task.upper()}:")
                for metric, score in metrics.items():
                    logger.info(f"    {metric}: {score:.4f}")
            
            # Print overall score
            overall = avg_scores[model]
            logger.info(f"  OVERALL: {overall:.4f}")
    
    else:
        logger.error("No results were generated. Please check the following:")
        logger.error("1. Ensure you have valid API keys in your .env file")
        logger.error("2. Check that all required dependencies are installed")

if __name__ == "__main__":
    main() 