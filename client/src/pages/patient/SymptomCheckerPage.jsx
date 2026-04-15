import React, { useState } from 'react';
import { Activity, AlertCircle, ArrowRight, CheckCircle2, Loader2, Stethoscope, Clock, ShieldAlert, FileText } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import {
  Card,
  CardContent
} from '../../components/shared/Card';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function SymptomCheckerPage() {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [symptom, setSymptom] = useState('');
  const [duration, setDuration] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/patient/symptoms/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symptoms: symptom,
          duration: duration,
          additionalInfo: {}
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze symptoms');
      }

      if (data.success) {
        setAnalysisResult(data.analysis);
        setStep(3);
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Symptom analysis error:', err);
      setError(err.message || 'Unable to analyze symptoms. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchColor = (match) => {
    switch (match) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getMatchLabel = (match) => {
    switch (match) {
      case 'high': return 'High Match';
      case 'medium': return 'Medium Match';
      case 'low': return 'Possible Match';
      default: return 'Match';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'immediate': return 'Seek Immediate Care';
      case 'soon': return 'See Doctor Within 24-48 Hours';
      case 'routine': return 'Schedule Routine Check-up';
      default: return 'Consult a Doctor';
    }
  };

  const resetAnalysis = () => {
    setStep(1);
    setSymptom('');
    setDuration('');
    setAnalysisResult(null);
    setError(null);
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

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
                  disabled={symptom.length < 3}
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
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Symptoms'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && analysisResult && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 text-green-600 border-b border-slate-100 pb-4">
                <CheckCircle2 size={24} />
                <h3 className="text-xl font-semibold">Analysis Complete</h3>
              </div>

              {/* Severity/Urgency Banner */}
              <div className={`p-4 rounded-lg border ${getSeverityColor(analysisResult.severity)}`}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  <span className="font-medium">{getUrgencyLabel(analysisResult.urgency)}</span>
                </div>
              </div>

              {/* Detected Symptoms */}
              {analysisResult.detectedSymptoms && analysisResult.detectedSymptoms.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Detected Symptoms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.detectedSymptoms.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm capitalize">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Possible Conditions */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">
                  Possible Conditions
                </h4>

                {analysisResult.possibleConditions && analysisResult.possibleConditions.length > 0 ? (
                  <ul className="space-y-2">
                    {analysisResult.possibleConditions.map((condition, idx) => (
                      <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-800">
                          {condition.name}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded ${getMatchColor(condition.match)}`}>
                          {getMatchLabel(condition.match)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">No specific conditions matched. Please consult a general physician.</p>
                )}
              </div>

              {/* Recommended Specialties */}
              {analysisResult.recommendedSpecialties && analysisResult.recommendedSpecialties.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Recommended Specialists
                  </h4>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-blue-800 mb-3">
                      Based on your symptoms, we recommend consulting with:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.recommendedSpecialties.map((specialty, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <Button className="mt-4 w-full sm:w-auto" variant="outline">
                      Find a Specialist
                    </Button>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations && (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recommendations
                  </h4>

                  {analysisResult.recommendations.immediateActions && analysisResult.recommendations.immediateActions.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Immediate Actions:</p>
                      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                        {analysisResult.recommendations.immediateActions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.recommendations.selfCare && analysisResult.recommendations.selfCare.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-700 mb-2">Self-Care Tips:</p>
                      <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                        {analysisResult.recommendations.selfCare.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.recommendations.whenToSeeDoctor && analysisResult.recommendations.whenToSeeDoctor.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-amber-700 mb-2">When to See a Doctor:</p>
                      <ul className="list-disc list-inside text-sm text-amber-600 space-y-1">
                        {analysisResult.recommendations.whenToSeeDoctor.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* AI Provider Badge */}
              {analysisResult.aiProvider && (
                <div className="flex justify-end">
                  <span className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Powered by {analysisResult.aiProvider}
                  </span>
                </div>
              )}

              {/* AI Insight (if available) */}
              {analysisResult.aiInsight && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-700 mb-1">AI Medical Insight:</p>
                  <p className="text-sm text-indigo-600">{analysisResult.aiInsight}</p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-700 mb-1">Disclaimer:</p>
                <p>{analysisResult.disclaimer}</p>
              </div>

              <div className="flex justify-center pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  onClick={resetAnalysis}
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