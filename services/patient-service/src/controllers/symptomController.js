const axios = require('axios');

let geminiModelCache = null;
let geminiModelCacheAtMs = 0;

const GEMINI_MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

const getGeminiModelName = async () => {
  const preferred = (process.env.GOOGLE_GEMINI_MODEL || '').trim();
  if (preferred) return preferred;

  const now = Date.now();
  if (geminiModelCache && now - geminiModelCacheAtMs < GEMINI_MODEL_CACHE_TTL_MS) {
    return geminiModelCache;
  }

  if (!process.env.GOOGLE_GEMINI_API_KEY) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
  const { data } = await axios.get(url, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000
  });

  const models = Array.isArray(data?.models) ? data.models : [];
  const supportsGenerateContent = (m) => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent');

  const candidates = models
    .filter(supportsGenerateContent)
    .map((m) => m.name)
    .filter(Boolean);

  const preferenceOrder = [
    'models/gemini-1.5-flash',
    'models/gemini-1.5-pro',
    'models/gemini-1.0-pro',
    'models/gemini-pro'
  ];

  const picked = preferenceOrder.find((name) => candidates.includes(name)) || candidates[0] || null;

  geminiModelCache = picked;
  geminiModelCacheAtMs = now;

  return picked;
};

// Medical knowledge base for symptom analysis
const medicalKnowledgeBase = {
  // Symptom to possible conditions mapping
  conditions: {
    'headache': [
      { name: 'Tension Headache', match: 'high', specialties: ['Neurologist', 'General Physician'] },
      { name: 'Migraine', match: 'medium', specialties: ['Neurologist'] },
      { name: 'Sinusitis', match: 'medium', specialties: ['ENT Specialist'] }
    ],
    'fever': [
      { name: 'Viral Infection', match: 'high', specialties: ['General Physician', 'Internal Medicine'] },
      { name: 'Influenza', match: 'medium', specialties: ['General Physician'] },
      { name: 'COVID-19', match: 'low', specialties: ['General Physician', 'Pulmonologist'] }
    ],
    'cough': [
      { name: 'Common Cold', match: 'high', specialties: ['General Physician'] },
      { name: 'Bronchitis', match: 'medium', specialties: ['Pulmonologist', 'General Physician'] },
      { name: 'Pneumonia', match: 'low', specialties: ['Pulmonologist', 'General Physician'] }
    ],
    'chest pain': [
      { name: 'Angina', match: 'high', specialties: ['Cardiologist'] },
      { name: 'Costochondritis', match: 'medium', specialties: ['Orthopedist', 'General Physician'] },
      { name: 'Anxiety', match: 'low', specialties: ['Psychiatrist', 'General Physician'] }
    ],
    'shortness of breath': [
      { name: 'Asthma', match: 'high', specialties: ['Pulmonologist', 'Allergist'] },
      { name: 'Anxiety', match: 'medium', specialties: ['Psychiatrist'] },
      { name: 'Heart Failure', match: 'low', specialties: ['Cardiologist'] }
    ],
    'abdominal pain': [
      { name: 'Gastritis', match: 'high', specialties: ['Gastroenterologist', 'General Physician'] },
      { name: 'Appendicitis', match: 'medium', specialties: ['General Surgeon'] },
      { name: 'IBS', match: 'low', specialties: ['Gastroenterologist'] }
    ],
    'nausea': [
      { name: 'Food Poisoning', match: 'high', specialties: ['Gastroenterologist', 'General Physician'] },
      { name: 'Motion Sickness', match: 'medium', specialties: ['General Physician'] },
      { name: 'Pregnancy', match: 'low', specialties: ['Gynecologist'] }
    ],
    'diarrhea': [
      { name: 'Gastroenteritis', match: 'high', specialties: ['Gastroenterologist', 'General Physician'] },
      { name: 'Food Intolerance', match: 'medium', specialties: ['Gastroenterologist', 'Allergist'] },
      { name: 'IBS', match: 'low', specialties: ['Gastroenterologist'] }
    ],
    'rash': [
      { name: 'Allergic Reaction', match: 'high', specialties: ['Dermatologist', 'Allergist'] },
      { name: 'Eczema', match: 'medium', specialties: ['Dermatologist'] },
      { name: 'Contact Dermatitis', match: 'medium', specialties: ['Dermatologist'] }
    ],
    'joint pain': [
      { name: 'Osteoarthritis', match: 'high', specialties: ['Orthopedist', 'Rheumatologist'] },
      { name: 'Rheumatoid Arthritis', match: 'medium', specialties: ['Rheumatologist'] },
      { name: 'Gout', match: 'low', specialties: ['Rheumatologist'] }
    ],
    'back pain': [
      { name: 'Muscle Strain', match: 'high', specialties: ['Orthopedist', 'Physiotherapist'] },
      { name: 'Herniated Disc', match: 'medium', specialties: ['Orthopedist', 'Neurosurgeon'] },
      { name: 'Sciatica', match: 'low', specialties: ['Orthopedist', 'Neurologist'] }
    ],
    'dizziness': [
      { name: 'Vertigo', match: 'high', specialties: ['ENT Specialist', 'Neurologist'] },
      { name: 'Low Blood Pressure', match: 'medium', specialties: ['Cardiologist', 'General Physician'] },
      { name: 'Anemia', match: 'low', specialties: ['Hematologist', 'General Physician'] }
    ],
    'fatigue': [
      { name: 'Anemia', match: 'high', specialties: ['Hematologist', 'General Physician'] },
      { name: 'Hypothyroidism', match: 'medium', specialties: ['Endocrinologist'] },
      { name: 'Chronic Fatigue Syndrome', match: 'low', specialties: ['General Physician', 'Rheumatologist'] }
    ],
    'sore throat': [
      { name: 'Pharyngitis', match: 'high', specialties: ['ENT Specialist', 'General Physician'] },
      { name: 'Tonsillitis', match: 'medium', specialties: ['ENT Specialist'] },
      { name: 'Strep Throat', match: 'medium', specialties: ['ENT Specialist', 'General Physician'] }
    ],
    'runny nose': [
      { name: 'Common Cold', match: 'high', specialties: ['General Physician'] },
      { name: 'Allergic Rhinitis', match: 'medium', specialties: ['Allergist', 'ENT Specialist'] },
      { name: 'Sinusitis', match: 'low', specialties: ['ENT Specialist'] }
    ],
    'eye pain': [
      { name: 'Conjunctivitis', match: 'high', specialties: ['Ophthalmologist'] },
      { name: 'Dry Eye Syndrome', match: 'medium', specialties: ['Ophthalmologist'] },
      { name: 'Glaucoma', match: 'low', specialties: ['Ophthalmologist'] }
    ],
    'ear pain': [
      { name: 'Ear Infection', match: 'high', specialties: ['ENT Specialist'] },
      { name: 'Ear Wax Buildup', match: 'medium', specialties: ['ENT Specialist'] },
      { name: 'TMJ Disorder', match: 'low', specialties: ['Dentist', 'ENT Specialist'] }
    ],
    'toothache': [
      { name: 'Dental Caries', match: 'high', specialties: ['Dentist'] },
      { name: 'Gingivitis', match: 'medium', specialties: ['Dentist'] },
      { name: 'Dental Abscess', match: 'medium', specialties: ['Dentist'] }
    ],
    'weight loss': [
      { name: 'Hyperthyroidism', match: 'high', specialties: ['Endocrinologist'] },
      { name: 'Diabetes', match: 'medium', specialties: ['Endocrinologist', 'General Physician'] },
      { name: 'Cancer', match: 'low', specialties: ['Oncologist', 'General Physician'] }
    ],
    'insomnia': [
      { name: 'Sleep Disorder', match: 'high', specialties: ['Sleep Specialist', 'Psychiatrist'] },
      { name: 'Anxiety', match: 'medium', specialties: ['Psychiatrist'] },
      { name: 'Sleep Apnea', match: 'low', specialties: ['Sleep Specialist', 'Pulmonologist'] }
    ],
    'anxiety': [
      { name: 'Generalized Anxiety Disorder', match: 'high', specialties: ['Psychiatrist', 'Psychologist'] },
      { name: 'Panic Disorder', match: 'medium', specialties: ['Psychiatrist'] },
      { name: 'Social Anxiety', match: 'low', specialties: ['Psychiatrist', 'Psychologist'] }
    ],
    'depression': [
      { name: 'Major Depressive Disorder', match: 'high', specialties: ['Psychiatrist', 'Psychologist'] },
      { name: 'Bipolar Disorder', match: 'low', specialties: ['Psychiatrist'] },
      { name: 'Seasonal Affective Disorder', match: 'low', specialties: ['Psychiatrist'] }
    ],
    'palpitations': [
      { name: 'Arrhythmia', match: 'high', specialties: ['Cardiologist'] },
      { name: 'Anxiety', match: 'medium', specialties: ['Psychiatrist', 'Cardiologist'] },
      { name: 'Hyperthyroidism', match: 'low', specialties: ['Endocrinologist', 'Cardiologist'] }
    ],
    'swelling': [
      { name: 'Edema', match: 'high', specialties: ['Cardiologist', 'Nephrologist'] },
      { name: 'Allergic Reaction', match: 'medium', specialties: ['Allergist', 'Dermatologist'] },
      { name: 'Deep Vein Thrombosis', match: 'low', specialties: ['Vascular Surgeon', 'Hematologist'] }
    ],
    'urinary problems': [
      { name: 'UTI', match: 'high', specialties: ['Urologist', 'Nephrologist', 'General Physician'] },
      { name: 'Kidney Stones', match: 'medium', specialties: ['Urologist', 'Nephrologist'] },
      { name: 'Prostate Issues', match: 'low', specialties: ['Urologist'] }
    ],
    'menstrual irregularities': [
      { name: 'PCOS', match: 'high', specialties: ['Gynecologist', 'Endocrinologist'] },
      { name: 'Endometriosis', match: 'medium', specialties: ['Gynecologist'] },
      { name: 'Thyroid Disorder', match: 'low', specialties: ['Endocrinologist', 'Gynecologist'] }
    ]
  }
};

// Analyze symptoms using AI/NLP approach
const analyzeSymptomsWithAI = (symptoms, duration, additionalInfo = {}) => {
  const symptoms_lower = symptoms.toLowerCase();
  const matchedConditions = [];
  const recommendedSpecialties = new Set();
  
  // Extract key symptoms from input
  const symptomKeywords = Object.keys(medicalKnowledgeBase.conditions);
  const detectedSymptoms = [];
  
  symptomKeywords.forEach(keyword => {
    if (symptoms_lower.includes(keyword)) {
      detectedSymptoms.push(keyword);
      const conditions = medicalKnowledgeBase.conditions[keyword];
      conditions.forEach(condition => {
        matchedConditions.push({
          ...condition,
          sourceSymptom: keyword
        });
        condition.specialties.forEach(spec => recommendedSpecialties.add(spec));
      });
    }
  });
  
  // If no direct matches, try to extract from general description
  if (detectedSymptoms.length === 0) {
    // General analysis based on keywords
    const generalKeywords = {
      'pain': ['General Physician', 'Pain Specialist'],
      'burning': ['General Physician', 'Dermatologist', 'Urologist'],
      'itching': ['Dermatologist', 'Allergist'],
      'numbness': ['Neurologist', 'Orthopedist'],
      'tingling': ['Neurologist', 'Orthopedist'],
      'weakness': ['General Physician', 'Neurologist'],
      'bleeding': ['General Physician', 'Surgeon'],
      'vomiting': ['Gastroenterologist', 'General Physician']
    };
    
    Object.keys(generalKeywords).forEach(keyword => {
      if (symptoms_lower.includes(keyword)) {
        generalKeywords[keyword].forEach(spec => recommendedSpecialties.add(spec));
      }
    });
    
    // Default recommendation if still no matches
    if (recommendedSpecialties.size === 0) {
      recommendedSpecialties.add('General Physician');
    }
    
    matchedConditions.push({
      name: 'Unspecified Condition',
      match: 'low',
      specialties: ['General Physician'],
      note: 'Based on your description, we recommend consulting a general physician for proper evaluation.'
    });
  }
  
  // Sort conditions by match level
  const matchPriority = { high: 3, medium: 2, low: 1 };
  matchedConditions.sort((a, b) => matchPriority[b.match] - matchPriority[a.match]);
  
  // Remove duplicates while preserving highest match
  const uniqueConditions = [];
  const seenConditions = new Set();
  
  matchedConditions.forEach(condition => {
    if (!seenConditions.has(condition.name)) {
      seenConditions.add(condition.name);
      uniqueConditions.push(condition);
    }
  });
  
  // Limit to top 5 conditions
  const topConditions = uniqueConditions.slice(0, 5);
  
  // Generate severity assessment based on duration and symptoms
  let severity = 'low';
  const severityIndicators = {
    high: ['chest pain', 'shortness of breath', 'severe bleeding', 'unconscious', 'paralysis', 'severe headache', 'difficulty breathing'],
    medium: ['fever', 'persistent pain', 'vomiting', 'diarrhea', 'dizziness']
  };
  
  severityIndicators.high.forEach(indicator => {
    if (symptoms_lower.includes(indicator)) severity = 'high';
  });
  
  if (severity !== 'high') {
    severityIndicators.medium.forEach(indicator => {
      if (symptoms_lower.includes(indicator)) severity = 'medium';
    });
  }
  
  // Adjust severity based on duration
  if (duration && (duration.includes('week') || duration.includes('month'))) {
    if (severity === 'low') severity = 'medium';
  }
  
  // Generate urgency level
  let urgency = 'routine';
  if (severity === 'high') urgency = 'immediate';
  else if (severity === 'medium') urgency = 'soon';
  
  // Generate recommendations
  const recommendations = generateRecommendations(topConditions, severity, duration, [...recommendedSpecialties]);
  
  return {
    detectedSymptoms,
    possibleConditions: topConditions,
    recommendedSpecialties: [...recommendedSpecialties],
    severity,
    urgency,
    recommendations,
    aiProvider: 'Local AI Engine',
    disclaimer: 'This analysis is for informational purposes only and should not be considered as a medical diagnosis. Please consult with a qualified healthcare provider for proper evaluation and treatment.'
  };
};

// Generate detailed recommendations
const generateRecommendations = (conditions, severity, duration, specialties) => {
  const recommendations = {
    immediateActions: [],
    selfCare: [],
    whenToSeeDoctor: [],
    suggestedTests: []
  };
  
  // Immediate actions based on severity
  if (severity === 'high') {
    recommendations.immediateActions.push(
      'Seek emergency medical attention immediately',
      'Call emergency services if symptoms worsen'
    );
  } else if (severity === 'medium') {
    recommendations.immediateActions.push(
      'Schedule a doctor appointment within 24-48 hours',
      'Monitor your symptoms closely'
    );
  } else {
    recommendations.immediateActions.push(
      'Schedule a routine check-up if symptoms persist',
      'Monitor symptoms for any changes'
    );
  }
  
  // Self-care recommendations
  recommendations.selfCare = [
    'Get adequate rest and stay hydrated',
    'Avoid self-medication without professional advice',
    'Keep a symptom diary to track changes'
  ];
  
  // When to see doctor
  recommendations.whenToSeeDoctor = [
    'If symptoms worsen or new symptoms appear',
    'If symptoms persist beyond expected duration',
    'If you experience severe pain or discomfort',
    'If you have underlying health conditions'
  ];
  
  return recommendations;
};

// Symptom analysis endpoint
exports.analyzeSymptoms = async (req, res) => {
  try {
    const { userId } = req;
    const { symptoms, duration, additionalInfo } = req.body;
    
    if (!symptoms || symptoms.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed description of your symptoms'
      });
    }
    
    // Perform local AI analysis
    const analysis = analyzeSymptomsWithAI(symptoms, duration, additionalInfo);
    let aiEnhanced = false;
    
    // Try Google Gemini first (free tier: 60 requests/min)
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        const enhancedAnalysis = await enhanceWithGemini(symptoms, duration, analysis);
        Object.assign(analysis, enhancedAnalysis);
        aiEnhanced = true;
      } catch (aiError) {
        console.log('Gemini enhancement failed:', aiError.message);
      }
    }
    
    // Fallback to Hugging Face if Gemini not available/enhanced
    if (!aiEnhanced && process.env.HUGGINGFACE_API_KEY) {
      try {
        const enhancedAnalysis = await enhanceWithHuggingFace(symptoms, duration, analysis);
        Object.assign(analysis, enhancedAnalysis);
        aiEnhanced = true;
      } catch (aiError) {
        console.log('Hugging Face enhancement failed:', aiError.message);
      }
    }
    
    // Fallback to OpenAI if others failed
    if (!aiEnhanced && process.env.OPENAI_API_KEY) {
      try {
        const enhancedAnalysis = await enhanceWithOpenAI(symptoms, duration, analysis);
        Object.assign(analysis, enhancedAnalysis);
      } catch (aiError) {
        console.log('OpenAI enhancement failed, using local analysis:', aiError.message);
      }
    }
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Symptom analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing symptoms',
      error: error.message
    });
  }
};

// Enhance analysis with OpenAI GPT (optional)
const enhanceWithOpenAI = async (symptoms, duration, localAnalysis) => {
  const prompt = `As a medical AI assistant, analyze these symptoms and provide additional insights:

Symptoms: ${symptoms}
Duration: ${duration}
Local Analysis: ${JSON.stringify(localAnalysis.possibleConditions)}

Provide a brief medical insight (2-3 sentences) about these symptoms, emphasizing that this is not a diagnosis and professional medical consultation is required.`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful medical information assistant. Always emphasize that your responses are for informational purposes only and not medical advice.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return {
      aiInsight: response.data.choices[0].message.content,
      aiProvider: 'OpenAI'
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return {};
  }
};

// Enhance analysis with Google Gemini (Free tier: 60 requests/minute)
const enhanceWithGemini = async (symptoms, duration, localAnalysis) => {
  const prompt = `You are a medical AI assistant. Analyze these symptoms and provide a brief medical insight (2-3 sentences).

Patient Symptoms: ${symptoms}
Duration: ${duration}
Possible Conditions Identified: ${localAnalysis.possibleConditions.map(c => c.name).join(', ')}
Detected Symptoms: ${localAnalysis.detectedSymptoms.join(', ')}

Provide a concise medical insight that:
1. Acknowledges the patient's symptoms
2. Mentions the possible conditions briefly
3. Emphasizes this is not a diagnosis and professional medical consultation is required

Keep your response brief (2-3 sentences max) and helpful. Always include a disclaimer that this is not medical advice.`;

  try {
    const modelName = await getGeminiModelName();
    if (!modelName) {
      throw new Error('Gemini model unavailable (missing GOOGLE_GEMINI_API_KEY)');
    }

    const makeRequest = async () => axios.post(
      `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
          topP: 0.8,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    let response;
    try {
      response = await makeRequest();
    } catch (err) {
      const status = err?.response?.status;
      const apiStatus = err?.response?.data?.error?.status;
      if (status === 404 || apiStatus === 'NOT_FOUND') {
        geminiModelCache = null;
        geminiModelCacheAtMs = 0;
        const refreshedModelName = await getGeminiModelName();
        if (!refreshedModelName) throw err;
        response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/${refreshedModelName}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
          {
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 200,
              topP: 0.8,
              topK: 40
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
      } else {
        throw err;
      }
    }
    
    // Extract the generated text from Gemini response
    let insight = '';
    if (response.data.candidates && response.data.candidates[0]) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        insight = candidate.content.parts[0].text || '';
      }
    }
    
    // Check for safety blocks or finish reasons
    if (response.data.candidates && response.data.candidates[0].finishReason === 'SAFETY') {
      insight = 'AI analysis completed. Please consult a healthcare professional for proper diagnosis and treatment. This information is for educational purposes only.';
    }
    
    insight = insight.trim();
    
    return {
      aiInsight: insight || 'AI analysis completed. Please consult a healthcare professional for proper diagnosis.',
      aiProvider: 'Google Gemini'
    };
  } catch (error) {
    console.error('Gemini API error:', error.message);
    if (error.response?.data?.error) {
      console.error('Gemini Error details:', JSON.stringify(error.response.data.error));
    }
    throw error;
  }
};

// Enhance analysis with Hugging Face Open Source AI (Fallback option)
const enhanceWithHuggingFace = async (symptoms, duration, localAnalysis) => {
  const prompt = `<|system|>
You are a medical AI assistant. Provide helpful medical information while emphasizing that your responses are for informational purposes only and not medical advice.
 
Analyze these symptoms and provide a brief medical insight (2-3 sentences):

Symptoms: ${symptoms}
Duration: ${duration}
Possible Conditions: ${localAnalysis.possibleConditions.map(c => c.name).join(', ')}

Emphasize that this is not a diagnosis and professional medical consultation is required.
<|assistant|>`;

  try {
    // Using Mistral-7B-Instruct model via Hugging Face
    // Free tier: 1,000 requests/day or 10,000 requests/month
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.3,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout for cold start
      }
    );
    
    let insight = '';
    
    // Handle different response formats
    if (Array.isArray(response.data) && response.data[0]) {
      insight = response.data[0].generated_text || '';
    } else if (response.data.generated_text) {
      insight = response.data.generated_text;
    }
    
    // Clean up the response
    insight = insight.trim();
    
    // If the model is loading (cold start), return empty and retry later
    if (response.data.error && response.data.error.includes('currently loading')) {
      console.log('Hugging Face model is loading, using local analysis...');
      return { aiProvider: 'Hugging Face (Local Fallback)' };
    }
    
    return {
      aiInsight: insight || 'AI analysis completed. Please consult a healthcare professional for proper diagnosis.',
      aiProvider: 'Hugging Face (Mistral-7B)'
    };
  } catch (error) {
    console.error('Hugging Face API error:', error.message);
    if (error.response?.data?.error) {
      console.error('HF Error details:', error.response.data.error);
    }
    throw error;
  }
};

// Alternative: Use a medical-specific model on Hugging Face
const enhanceWithMedicalModel = async (symptoms, duration, localAnalysis) => {
  try {
    // Using BioGPT or similar medical model
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/BioGPT-Large',
      {
        inputs: `Symptoms: ${symptoms}. Duration: ${duration}. What could be the possible conditions?`,
        parameters: {
          max_new_tokens: 100,
          temperature: 0.3,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    let insight = '';
    if (Array.isArray(response.data) && response.data[0]) {
      insight = response.data[0].generated_text || '';
    } else if (response.data.generated_text) {
      insight = response.data.generated_text;
    }
    
    return {
      aiInsight: insight.trim(),
      aiProvider: 'Hugging Face (BioGPT)'
    };
  } catch (error) {
    console.error('Medical model error:', error.message);
    throw error;
  }
};
