import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Copy, Check, Wand2, Sparkles, RefreshCw, MessageSquare } from 'lucide-react';

async function complete(prompt) {
  const response = await fetch('/api/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.completion;
}

const PromptMaker = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [taskDescription, setTaskDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [finalPrompt, setFinalPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const steps = [
    { title: 'Describe Your Task', desc: 'Tell us what you want to accomplish' },
    { title: 'Answer Questions', desc: 'Tailored questions for your specific task' },
    { title: 'Your Custom Prompt', desc: 'Ready-to-use prompt for any AI tool' }
  ];

  const generateQuestions = async () => {
    setLoading(true);
    setError('');

    try {
      const prompt = `
User's task description: "${taskDescription}"

Based on this task description, generate 5-7 highly relevant questions that would help create an effective prompt for this specific task. These questions should be:
1. Specific to the task at hand (not generic)
2. Help gather context that would improve the final prompt
3. Cover different aspects like audience, goals, constraints, format, style, etc.
4. Be practical and actionable
5. Avoid redundancy with information already provided

Respond with a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Your specific question here?",
      "type": "audience|goal|content|format|constraints|style|context",
      "placeholder": "e.g., example of what kind of answer to expect"
    }
  ]
}

Your entire response MUST be a single, valid JSON object. Do not include any other text, formatting, or code blocks.
`;

      const response = await complete(prompt);
      const parsedResponse = JSON.parse(response);

      if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
        setQuestions(parsedResponse.questions);
        setAnswers({});
        setCurrentStep(1);
      } else {
        setError('Invalid response format from AI');
      }
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error('Error generating questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateFinalPrompt = async () => {
    setLoading(true);
    setError('');

    try {
      const answersText = questions.map((q, i) =>
        `${i + 1}. ${q.question}\nAnswer: "${answers[i] || 'Not specified'}"`
      ).join('\n\n');

      const prompt = `
Original task: "${taskDescription}"

User's answers to the generated questions:
${answersText}

Based on the original task and these answers, create a comprehensive, well-structured prompt that incorporates best practices for prompt engineering. The prompt should be ready to copy-paste into an AI tool.

Structure it with:
- Clear role definition if appropriate
- Specific instructions based on the task
- Context and background information
- Target audience details
- Output format requirements
- Tone and style guidelines
- Any constraints or special requirements
- Clear deliverables

Make it professional, effective, and comprehensive. Include all relevant context provided by the user.

Respond with a JSON object in this format:
{
  "prompt": "Your complete prompt text here..."
}

Your entire response MUST be a single, valid JSON object.
`;

      const response = await complete(prompt);
      const parsedResponse = JSON.parse(response);

      if (parsedResponse.prompt) {
        setFinalPrompt(parsedResponse.prompt);
        setCurrentStep(2);
      } else {
        setError('Failed to generate final prompt');
      }
    } catch (err) {
      setError('Failed to generate final prompt. Please try again.');
      console.error('Error generating final prompt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnswerChange = (index, value) => {
    setAnswers(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const canProceedToQuestions = () => {
    return taskDescription.trim().length > 20;
  };

  const canProceedToPrompt = () => {
    const answeredQuestions = Object.keys(answers).filter(key => answers[key]?.trim()).length;
    return answeredQuestions >= Math.ceil(questions.length / 2); // At least half answered
  };

  const startOver = () => {
    setCurrentStep(0);
    setTaskDescription('');
    setQuestions([]);
    setAnswers({});
    setFinalPrompt('');
    setError('');
    setCopied(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Describe Your Task</h2>
              <p className="text-gray-600">Tell us what you want to accomplish. The more specific you are, the better questions we can generate for you.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to create or accomplish?
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="e.g., Write a blog post about sustainable living tips for beginners, Create a Python script to analyze sales data, Design a presentation for a product launch, Draft an email to announce our new service..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="6"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Pro Tip</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Be as specific as possible! Include details about your goals, audience, format preferences, or any constraints. This helps us generate more relevant questions.
                    </p>
                  </div>
                </div>
              </div>

              {taskDescription.trim().length > 0 && taskDescription.trim().length < 20 && (
                <div className="text-sm text-amber-600">
                  Please provide a more detailed description (at least 20 characters)
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Answer These Questions</h2>
              <p className="text-gray-600">
                These questions are specifically tailored to your task. Answer as many as you can for the best results.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Your Task:</h3>
              <p className="text-gray-700 italic">"{taskDescription}"</p>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {index + 1}. {question.question}
                  </label>
                  <textarea
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800">Progress</h4>
                  <p className="text-sm text-green-700 mt-1">
                    You've answered {Object.keys(answers).filter(key => answers[key]?.trim()).length} of {questions.length} questions.
                    Answer at least {Math.ceil(questions.length / 2)} to proceed.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Custom Prompt</h2>
              <p className="text-gray-600">
                Here's your personalized prompt, ready to use with any AI tool
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Generated Prompt</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                  {finalPrompt}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">How to Use</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Copy the prompt above</li>
                  <li>• Paste it into ChatGPT, Claude, or any AI tool</li>
                  <li>• Review and refine the results as needed</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Pro Tips</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Test and iterate based on results</li>
                  <li>• Add specific examples if needed</li>
                  <li>• Break complex tasks into smaller steps</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Wand2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Smart Prompt Maker</h1>
        </div>
        <p className="text-gray-600">Generate personalized questions and create perfect prompts for any AI tool</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`text-xs text-center flex-1 ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className="font-medium">{step.title}</div>
              <div className="text-xs mt-1 opacity-75">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={currentStep === 0 ? startOver : () => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 0}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            currentStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex space-x-3">
          {currentStep === 0 && (
            <button
              onClick={generateQuestions}
              disabled={!canProceedToQuestions() || loading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                canProceedToQuestions() && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Generating...' : 'Generate Questions'}</span>
            </button>
          )}

          {currentStep === 1 && (
            <button
              onClick={generateFinalPrompt}
              disabled={!canProceedToPrompt() || loading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                canProceedToPrompt() && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              <span>{loading ? 'Creating...' : 'Create Prompt'}</span>
            </button>
          )}

          {currentStep === 2 && (
            <button
              onClick={startOver}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Create Another</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptMaker;
