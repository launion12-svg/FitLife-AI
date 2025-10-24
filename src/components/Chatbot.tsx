

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getChatbot } from '../services/geminiService';
import type { ChatMessage, UpdateMealHandler, NutritionPlan } from '../types';
import { PaperAirplaneIcon } from './icons/Icons';
import { useLanguage } from '../contexts/LanguageContext';

const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
        <p className="whitespace-pre-wrap">
            {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
        </p>
    );
};

interface ChatbotProps {
    nutritionPlan: NutritionPlan;
    onUpdateMeal: UpdateMealHandler;
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const Chatbot: React.FC<ChatbotProps> = ({ nutritionPlan, onUpdateMeal, messages, setMessages }) => {
    const { t, language } = useLanguage();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const chat = useMemo(() => getChatbot(language), [language]);
    
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ role: 'model', text: t('chatbot.welcomeMessage') }]);
        }
    }, [t, messages.length, setMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);

        const contextHeader = language === 'es' ?
            "CONTEXTO: Este es el plan de nutrición actual del usuario. Úsalo para responder preguntas y realizar solicitudes de modificación." :
            "CONTEXT: Here is the user's current nutrition plan. Use it to answer questions and fulfill modification requests.";
        
        const questionHeader = language === 'es' ? "PREGUNTA DEL USUARIO" : "USER QUESTION";

        const currentInputWithContext = `${contextHeader}\n\`\`\`json\n${JSON.stringify(nutritionPlan, null, 2)}\n\`\`\`\n\n${questionHeader}: ${input}`;
        
        setInput('');
        setIsLoading(true);

        try {
            let response = await chat.sendMessage({ message: currentInputWithContext });
            
            while(response.functionCalls && response.functionCalls.length > 0) {
                const fc = response.functionCalls[0];
                let result: any;
                let success = false;

                if (fc.name === 'updateMealIngredient') {
                    const { day, mealName, oldIngredient, newIngredient, newMealName } = fc.args;
                    success = onUpdateMeal(day, mealName, oldIngredient, newIngredient, newMealName);
                    result = { status: success ? "OK" : "Failed", message: success ? "Meal updated successfully." : "Could not find the specified meal or ingredient." };
                } else {
                    result = { status: "Error", message: `Unknown function call: ${fc.name}`};
                }

                const functionResponse = {
                    functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: JSON.stringify(result) },
                    }
                };
                response = await chat.sendMessage(functionResponse);
            }


            const modelMessage: ChatMessage = { role: 'model', text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = { role: 'model', text: t('chatbot.errorMessage') };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4">
            <header className="mb-4">
                <h1 className="text-3xl font-bold">{t('chatbot.title')}</h1>
                <p className="text-on-surface-secondary">{t('chatbot.subtitle')}</p>
            </header>
            <div className="flex-grow overflow-y-auto bg-surface p-4 rounded-lg space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                            msg.role === 'user' 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-700 text-on-surface'
                        }`}>
                            <FormattedMessage text={msg.text} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-gray-700 text-on-surface">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-on-surface-secondary rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-on-surface-secondary rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-on-surface-secondary rounded-full animate-pulse delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t('chatbot.placeholder')}
                    className="flex-grow bg-surface border border-gray-600 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="bg-primary text-white p-3 rounded-r-lg hover:bg-primary-focus disabled:bg-gray-500"
                >
                    <PaperAirplaneIcon className="w-6 h-6"/>
                </button>
            </div>
        </div>
    );
};