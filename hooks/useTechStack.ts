import { useState, useEffect } from 'react';
import { TechStackConfig, DEFAULT_TECH_STACK } from '../types';

const TECH_STACK_KEY = 'fluidflow-tech-stack';

export const useTechStack = () => {
  const [techStack, setTechStack] = useState<TechStackConfig>(DEFAULT_TECH_STACK);

  // Load tech stack from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TECH_STACK_KEY);
      if (saved) {
        const parsedTechStack = JSON.parse(saved);
        // Merge with default to ensure all fields exist
        setTechStack({
          ...DEFAULT_TECH_STACK,
          ...parsedTechStack,
          // Deep merge for nested objects
          styling: { ...DEFAULT_TECH_STACK.styling, ...parsedTechStack.styling },
          icons: { ...DEFAULT_TECH_STACK.icons, ...parsedTechStack.icons },
          stateManagement: { ...DEFAULT_TECH_STACK.stateManagement, ...parsedTechStack.stateManagement },
          routing: { ...DEFAULT_TECH_STACK.routing, ...parsedTechStack.routing },
          dataFetching: { ...DEFAULT_TECH_STACK.dataFetching, ...parsedTechStack.dataFetching },
          forms: { ...DEFAULT_TECH_STACK.forms, ...parsedTechStack.forms },
          animations: { ...DEFAULT_TECH_STACK.animations, ...parsedTechStack.animations },
          testing: { ...DEFAULT_TECH_STACK.testing, ...parsedTechStack.testing }
        });
      }
    } catch (error) {
      console.error('Error loading tech stack:', error);
    }
  }, []);

  // Save to localStorage whenever tech stack changes
  useEffect(() => {
    try {
      localStorage.setItem(TECH_STACK_KEY, JSON.stringify(techStack));
    } catch (error) {
      console.error('Error saving tech stack:', error);
    }
  }, [techStack]);

  const updateTechStack = (category: keyof TechStackConfig, library: string, version?: string) => {
    setTechStack(prev => ({
      ...prev,
      [category]: {
        library: library as any,
        version: version || prev[category].version
      }
    }));
  };

  const resetTechStack = () => {
    setTechStack(DEFAULT_TECH_STACK);
  };

  // Generate system instruction based on current tech stack
  const generateSystemInstruction = () => {
    let instruction = '';

    // Styling instructions
    const styling = techStack.styling;
    switch (styling.library) {
      case 'tailwind':
        instruction += '\n- Use Tailwind CSS for styling with utility classes';
        break;
      case 'bootstrap':
        instruction += '\n- Use Bootstrap 5 for styling with CSS classes';
        break;
      case 'material-ui':
        instruction += '\n- Use Material-UI (MUI) components with Material Design';
        break;
      case 'ant-design':
        instruction += '\n- Use Ant Design components and styling system';
        break;
      case 'chakra-ui':
        instruction += '\n- Use Chakra UI components and styling props';
        break;
      case 'css-modules':
        instruction += '\n- Use CSS Modules with .module.css files for styling';
        break;
      case 'styled-components':
        instruction += '\n- Use styled-components for CSS-in-JS styling';
        break;
      case 'emotion':
        instruction += '\n- Use Emotion for CSS-in-JS styling with the @emotion/react package';
        break;
      default:
        instruction += '\n- Use modern CSS practices for styling';
    }

    // Icon instructions
    const icons = techStack.icons;
    switch (icons.library) {
      case 'lucide-react':
        instruction += '\n- Use lucide-react for icons (e.g., `<IconName className="w-4 h-4" />`)';
        break;
      case 'react-icons':
        instruction += '\n- Use react-icons library (e.g., `<FaIcon />`, `<AiIcon />`)';
        break;
      case 'heroicons':
        instruction += '\n- Use @heroicons/react for icons (e.g., `<IconName className="w-4 h-4" />`)';
        break;
      case 'material-icons':
        instruction += '\n- Use @mui/icons-material Material Icons';
        break;
      case 'font-awesome':
        instruction += '\n- Use @fortawesome/react-fontawesome Font Awesome icons';
        break;
      default:
        instruction += '\n- Use appropriate SVG icons for the interface';
    }

    // State management instructions
    const stateManagement = techStack.stateManagement;
    switch (stateManagement.library) {
      case 'zustand':
        instruction += '\n- Use Zustand for state management (create stores with `create` function)';
        break;
      case 'redux-toolkit':
        instruction += '\n- Use Redux Toolkit with configureStore and createSlice';
        break;
      case 'context-api':
        instruction += '\n- Use React Context API with useContext and useReducer hooks';
        break;
      case 'recoil':
        instruction += '\n- Use Recoil for state management (atoms, selectors, useRecoilState)';
        break;
      case 'mobx':
        instruction += '\n- Use MobX with observable and observer patterns';
        break;
      default:
        instruction += '\n- Use React built-in useState and useReducer hooks for state management';
    }

    // Routing instructions
    const routing = techStack.routing;
    switch (routing.library) {
      case 'react-router':
        instruction += '\n- Use React Router v6 for routing (BrowserRouter, Routes, Route, useNavigate)';
        break;
      case 'next-router':
        instruction += '\n- Use Next.js built-in router (useRouter, Link component)';
        break;
      case 'reach-router':
        instruction += '\n- Use Reach Router for accessible routing';
        break;
      default:
        instruction += '\n- Create a single-page application without routing';
    }

    // Data fetching instructions
    const dataFetching = techStack.dataFetching;
    switch (dataFetching.library) {
      case 'axios':
        instruction += '\n- Use axios for HTTP requests with proper error handling';
        break;
      case 'react-query':
        instruction += '\n- Use TanStack Query for server state management (useQuery, useMutation)';
        break;
      case 'swr':
        instruction += '\n- Use SWR for data fetching (useSWR hook)';
        break;
      case 'apollo-client':
        instruction += '\n- Use Apollo Client for GraphQL operations (useQuery, useMutation, gql)';
        break;
      default:
        instruction += '\n- Use the built-in fetch API for data requests';
    }

    // Form handling instructions
    const forms = techStack.forms;
    switch (forms.library) {
      case 'react-hook-form':
        instruction += '\n- Use React Hook Form for form handling (useForm, Controller)';
        break;
      case 'formik':
        instruction += '\n- Use Formik for form handling with Yup validation';
        break;
      case 'final-form':
        instruction += '\n- Use React Final Form for high-performance forms';
        break;
      default:
        instruction += '\n- Use standard HTML forms with React state management';
    }

    // Animation instructions
    const animations = techStack.animations;
    switch (animations.library) {
      case 'framer-motion':
        instruction += '\n- Use Framer Motion for animations (motion.div, useAnimation)';
        break;
      case 'react-spring':
        instruction += '\n- Use React Spring for spring-physics animations (useSpring, animated)';
        break;
      case 'react-transition-group':
        instruction += '\n- Use React Transition Group for transition components';
        break;
      default:
        instruction += '\n- Use CSS transitions and animations for motion effects';
    }

    return instruction;
  };

  return {
    techStack,
    updateTechStack,
    resetTechStack,
    generateSystemInstruction
  };
};