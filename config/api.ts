// API Configuration for IEEE CompConnect
// Uses NewsAPI for IEEE-related news and HuggingFace for NLP

export const NEWSAPI_BASE_URL = 'https://newsapi.org/v2';
export const NEWSAPI_KEY = 'YOUR_NEWSAPI_KEY'; // Get from https://newsapi.org

export const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
export const HUGGINGFACE_API_KEY = 'YOUR_HUGGINGFACE_API_KEY'; // Get from https://huggingface.co

// IEEE Branches (Sri Lanka)
export const IEEE_BRANCHES = [
  { id: 'mrt', name: 'Moratuwa', university: 'University of Moratuwa', city: 'Moratuwa' },
  { id: 'cmb', name: 'Colombo', university: 'University of Colombo', city: 'Colombo' },
  { id: 'pdn', name: 'Peradeniya', university: 'University of Peradeniya', city: 'Peradeniya' },
  { id: 'jfna', name: 'Jaffna', university: 'University of Jaffna', city: 'Jaffna' },
  { id: 'ruh', name: 'Ruhuna', university: 'University of Ruhuna', city: 'Matara' },
  { id: 'sliit', name: 'SLIIT', university: 'Sri Lanka Institute of IT', city: 'Malabe' },
  { id: 'nsbm', name: 'NSBM', university: 'NSBM Green University', city: 'Pitipana' },
  { id: 'iit', name: 'IIT', university: 'Informatics Institute of Technology', city: 'Colombo' },
];

// IEEE Technical Committees / Interest Areas
export const IEEE_TOPICS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Computer Vision',
  'Robotics',
  'Cybersecurity',
  'IoT',
  'Cloud Computing',
  'Blockchain',
  'Signal Processing',
  '5G Networks',
  'Quantum Computing',
  'Sustainable Technology',
];
