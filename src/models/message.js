import mongoose from "mongoose";
const Schema = mongoose.Schema;


const ImageSchema = new Schema({
    url: String,
});

const MessageSchema = new Schema({
    UserMessage: { 
        type: String, 
        
    },
    fileName: { 
        type: String,
    },
    AIMessage: { 
        type: String, 
    },
    promptTokens: {
        type: Number,
    },
    completionTokens: {
        type: Number,
    },
    accuracy: {
        type: Number,
    },
    relevance: {
        type: Number,
    },
    coherence: {
        type: Number,
    },
    toolUse: {
        type: Boolean,
    },
    model: {
        type: String,
    },
   
});

// Adjust these rates as needed.
MessageSchema.methods.calculateCost = function() {
    // No tokens, no cost
    if (!this.promptTokens && !this.completionTokens) {
        return 0;
    }
    
    const promptTokens = this.promptTokens || 0;
    const completionTokens = this.completionTokens || 0;
    
    // Costs in USD per 1M tokens (divide by 1,000,000 to get per-token cost)
    switch (this.model) {
    
        case 'gpt-4o':
            // $2.50 per 1M input tokens, $10 per 1M output tokens
            const inputCost_gpt4o = promptTokens * (2.50 / 1000000);
            const outputCost_gpt4o = completionTokens * (10 / 1000000);
            return inputCost_gpt4o + outputCost_gpt4o;
        case 'gpt-3.5-turbo':
            // $0.50 per 1M input tokens, $1.50 per 1M output tokens
            const inputCost_gpt35Turbo = promptTokens * (0.50 / 1000000);
            const outputCost_gpt35Turbo = completionTokens * (1.50 / 1000000);
            return inputCost_gpt35Turbo + outputCost_gpt35Turbo;
        case 'gpt-4o-mini':
            // $0.15 per 1M input tokens, $0.60 per 1M output tokens
            const inputCost_gpt4oMini = promptTokens * (0.15 / 1000000);
            const outputCost_gpt4oMini = completionTokens * (0.60 / 1000000);
            return inputCost_gpt4oMini + outputCost_gpt4oMini;
        case 'o1-mini':
            // $1.10 per 1M input tokens, $4.40 per 1M output tokens
            const inputCost_o1Mini = promptTokens * (1.10 / 1000000);
            const outputCost_o1Mini = completionTokens * (4.40 / 1000000);
            return inputCost_o1Mini + outputCost_o1Mini;
        case 'o3-mini':
            // $1.10 per 1M input tokens, $4.40 per 1M output tokens
            const inputCost_o3Mini = promptTokens * (1.10 / 1000000);
            const outputCost_o3Mini = completionTokens * (4.40 / 1000000);
            return inputCost_o3Mini + outputCost_o3Mini;
        case 'claude-3-5-haiku-20241022':
            // $1.10 per 1M input tokens, $4.40 per 1M output tokens
            const inputCost_claude35Haiku = promptTokens * (0.80 / 1000000);
            const outputCost_claude35Haiku = completionTokens * (4.0 / 1000000);
            return inputCost_claude35Haiku + outputCost_claude35Haiku;
        default:
            // Default case if model not recognized
            return 0;
    }
};


export const MessageModel = mongoose.model('Message', MessageSchema);

