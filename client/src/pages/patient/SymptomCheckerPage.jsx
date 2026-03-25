import React, { useState } from 'react';
import { Activity, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import {
  Card,
  CardContent
} from '../../components/shared/Card';

export function SymptomCheckerPage() {
  const [step, setStep] = useState(1);
  const [symptom, setSymptom] = useState('');
  const [duration, setDuration] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);

    setTimeout(() => {
      setIsAnalyzing(false);
      setStep(3);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <Activity size={32} />
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          AI Symptom Checker
        </h1>

        <p className="text-slate-500 mt-2 max-w-xl mx-auto">
          Describe your symptoms to get preliminary health insights and
          specialist recommendations.
          <span className="block mt-1 text-amber-600 font-medium text-sm">
            Note: This is not a substitute for professional medical advice.
          </span>
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <label className="block text-lg font-medium text-slate-900">
                  What are your main symptoms?
                </label>

                <textarea
                  className="w-full min-h-[120px] rounded-xl border border-slate-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="E.g., I have had a severe headache and mild fever for the past 2 days..."
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={symptom.length < 10}
                  className="gap-2"
                >
                  Next Step <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <label className="block text-lg font-medium text-slate-900">
                  How long have you been experiencing this?
                </label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    'Less than a day',
                    '1-3 days',
                    '1 week',
                    'More than a week'
                  ].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        duration === d
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertCircle
                  className="text-amber-600 shrink-0 mt-0.5"
                  size={20}
                />

                <p className="text-sm text-amber-800">
                  If you are experiencing severe chest pain, difficulty
                  breathing, or sudden weakness, please call emergency services
                  immediately.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>

                <Button
                  onClick={handleAnalyze}
                  disabled={!duration || isAnalyzing}
                  isLoading={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 text-green-600 border-b border-slate-100 pb-4">
                <CheckCircle2 size={24} />
                <h3 className="text-xl font-semibold">Analysis Complete</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">
                    Possible Conditions
                  </h4>

                  <ul className="space-y-2">
                    <li className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-medium text-slate-800">
                        Tension Headache
                      </span>
                      <span className="text-sm bg-slate-200 text-slate-700 px-2 py-1 rounded">
                        High Match
                      </span>
                    </li>

                    <li className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-medium text-slate-800">
                        Migraine
                      </span>
                      <span className="text-sm bg-slate-200 text-slate-700 px-2 py-1 rounded">
                        Medium Match
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">
                    Recommended Action
                  </h4>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-blue-800 mb-4">
                      Based on your symptoms, we recommend consulting with a{' '}
                      <strong>Neurologist</strong> or a{' '}
                      <strong>General Physician</strong> for a proper diagnosis.
                    </p>

                    <Button className="w-full sm:w-auto">
                      Find a Specialist
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep(1);
                    setSymptom('');
                    setDuration('');
                  }}
                >
                  Start New Analysis
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}