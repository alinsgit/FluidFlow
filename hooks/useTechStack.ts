import { useState, useEffect } from 'react';
import { TechStackConfig, DEFAULT_TECH_STACK, TECH_STACK_OPTIONS } from '../types';
import { getFluidFlowConfig } from '../services/fluidflowConfig';

const TECH_STACK_KEY = 'fluidflow-tech-stack';

// Helper to get option info from TECH_STACK_OPTIONS
const getOptionInfo = (category: keyof TechStackConfig, value: string) => {
  const options = TECH_STACK_OPTIONS[category];
  return options?.find(opt => opt.value === value);
};

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
        // Dynamic category key requires type assertion; each category has different library union types
        library: library as TechStackConfig[typeof category]['library'],
        version: version || prev[category].version
      }
    }));
  };

  const resetTechStack = () => {
    setTechStack(DEFAULT_TECH_STACK);
  };

  // Generate system instruction based on current tech stack and project rules
  const generateSystemInstruction = () => {
    let instruction = '';

    // Add project rules from FluidFlow config
    const config = getFluidFlowConfig();
    const rules = config.getRules();
    if (rules && rules.trim()) {
      instruction += `\n\n**PROJECT RULES (Follow these guidelines)**:\n${rules}`;
    }

    // Technology stack section header
    instruction += '\n\n**TECHNOLOGY STACK (Use these specific libraries and versions)**:';

    // Styling
    const stylingInfo = getOptionInfo('styling', techStack.styling.library);
    if (stylingInfo && stylingInfo.value !== 'css-modules') {
      instruction += `\n- **Styling**: ${stylingInfo.label} (${stylingInfo.version}) - ${stylingInfo.description}`;
      // Add specific usage hints
      if (stylingInfo.value === 'tailwind') {
        instruction += '. Use utility classes directly on elements.';
      } else if (stylingInfo.value === 'material-ui') {
        instruction += '. Import from @mui/material.';
      } else if (stylingInfo.value === 'chakra-ui') {
        instruction += '. Use style props on Chakra components.';
      }
    } else {
      instruction += '\n- **Styling**: CSS Modules with .module.css files';
    }

    // Icons
    const iconsInfo = getOptionInfo('icons', techStack.icons.library);
    if (iconsInfo) {
      instruction += `\n- **Icons**: ${iconsInfo.label} (${iconsInfo.version})`;
      if (iconsInfo.value === 'lucide-react') {
        instruction += '. Usage: `import { IconName } from "lucide-react"` then `<IconName className="w-4 h-4" />`';
      } else if (iconsInfo.value === 'react-icons') {
        instruction += '. Usage: `import { FaIcon } from "react-icons/fa"`';
      } else if (iconsInfo.value === 'heroicons') {
        instruction += '. Usage: `import { IconName } from "@heroicons/react/24/outline"`';
      }
    }

    // State Management
    const stateInfo = getOptionInfo('stateManagement', techStack.stateManagement.library);
    if (stateInfo && stateInfo.value !== 'none' && stateInfo.value !== 'context-api') {
      instruction += `\n- **State Management**: ${stateInfo.label} (${stateInfo.version}) - ${stateInfo.description}`;
      if (stateInfo.value === 'zustand') {
        instruction += '. Create stores with `create()` from zustand.';
      } else if (stateInfo.value === 'redux-toolkit') {
        instruction += '. Use `configureStore` and `createSlice`.';
      }
    } else if (stateInfo?.value === 'context-api') {
      instruction += '\n- **State Management**: React Context API with useContext and useReducer hooks';
    } else {
      instruction += '\n- **State Management**: React built-in useState/useReducer hooks';
    }

    // Routing
    const routingInfo = getOptionInfo('routing', techStack.routing.library);
    if (routingInfo && routingInfo.value !== 'none') {
      instruction += `\n- **Routing**: ${routingInfo.label} (${routingInfo.version})`;
      if (routingInfo.value === 'react-router') {
        instruction += '. Use BrowserRouter, Routes, Route, useNavigate, Link from "react-router".';
      } else if (routingInfo.value === 'reach-router') {
        instruction += '. Type-safe routing with full TypeScript support.';
      }
    } else {
      instruction += '\n- **Routing**: Single-page application (no routing library needed)';
    }

    // Data Fetching
    const dataInfo = getOptionInfo('dataFetching', techStack.dataFetching.library);
    if (dataInfo && dataInfo.value !== 'none' && dataInfo.value !== 'fetch') {
      instruction += `\n- **Data Fetching**: ${dataInfo.label} (${dataInfo.version})`;
      if (dataInfo.value === 'react-query') {
        instruction += '. Use useQuery, useMutation from "@tanstack/react-query".';
      } else if (dataInfo.value === 'swr') {
        instruction += '. Use useSWR hook from "swr".';
      } else if (dataInfo.value === 'axios') {
        instruction += '. Use axios for HTTP requests with proper error handling.';
      }
    } else {
      instruction += '\n- **Data Fetching**: Built-in fetch API';
    }

    // Forms
    const formsInfo = getOptionInfo('forms', techStack.forms.library);
    if (formsInfo && formsInfo.value !== 'none') {
      instruction += `\n- **Forms**: ${formsInfo.label} (${formsInfo.version})`;
      if (formsInfo.value === 'react-hook-form') {
        instruction += '. Use useForm, Controller, handleSubmit.';
      } else if (formsInfo.value === 'formik') {
        instruction += '. Use Formik with Yup for validation.';
      }
    } else {
      instruction += '\n- **Forms**: Standard HTML forms with React state';
    }

    // Animations
    const animInfo = getOptionInfo('animations', techStack.animations.library);
    if (animInfo && animInfo.value !== 'none') {
      instruction += `\n- **Animations**: ${animInfo.label} (${animInfo.version})`;
      if (animInfo.value === 'framer-motion') {
        instruction += '. Use motion components (motion.div) and useAnimation from "motion/react".';
      } else if (animInfo.value === 'react-spring') {
        instruction += '. Use useSpring, animated from "@react-spring/web".';
      }
    } else {
      instruction += '\n- **Animations**: CSS transitions and keyframe animations';
    }

    // Component Architecture Rules (CRITICAL for maintainability and inspection)
    instruction += '\n\n**COMPONENT ARCHITECTURE RULES (MANDATORY)**:';
    instruction += '\n- EVERY component MUST be in its own separate file - NEVER define multiple components in one file';
    instruction += '\n- App.tsx should ONLY contain routing/layout logic and import child components';
    instruction += '\n- Create a components/ directory with subdirectories for feature grouping';
    instruction += '\n- File structure example:';
    instruction += '\n  - src/components/Header/Header.tsx (or index.tsx)';
    instruction += '\n  - src/components/Header/HeaderNav.tsx';
    instruction += '\n  - src/components/Header/HeaderLogo.tsx';
    instruction += '\n  - src/components/ProductCard/ProductCard.tsx';
    instruction += '\n  - src/components/ProductCard/ProductImage.tsx';
    instruction += '\n  - src/components/ProductCard/ProductPrice.tsx';
    instruction += '\n- Each file exports ONE default component matching the filename';
    instruction += '\n- Shared/reusable components go in src/components/shared/ or src/components/ui/';
    instruction += '\n- Page-level components go in src/pages/ or src/views/';

    // FluidFlow ID Attributes (CRITICAL for element inspection and targeting)
    instruction += '\n\n**FLUIDFLOW ELEMENT IDENTIFICATION (MANDATORY for all interactive elements)**:';
    instruction += '\n- Add `data-ff-group` attribute to identify component groups (e.g., "header", "product-card", "sidebar")';
    instruction += '\n- Add `data-ff-id` attribute for unique element identification within a group';
    instruction += '\n- Format: data-ff-group="group-name" data-ff-id="element-name"';
    instruction += '\n- Examples:';
    instruction += '\n  - <header data-ff-group="header" data-ff-id="main-header">';
    instruction += '\n  - <nav data-ff-group="header" data-ff-id="navigation">';
    instruction += '\n  - <button data-ff-group="header" data-ff-id="menu-toggle">';
    instruction += '\n  - <div data-ff-group="product-card" data-ff-id="card-container">';
    instruction += '\n  - <img data-ff-group="product-card" data-ff-id="product-image">';
    instruction += '\n  - <span data-ff-group="product-card" data-ff-id="price-display">';
    instruction += '\n- ALWAYS add these attributes to: buttons, links, inputs, images, cards, sections, headers, footers';
    instruction += '\n- Use kebab-case for both group and id values';
    instruction += '\n- IDs should be descriptive and unique within their group';

    // Import Path Guidelines (Critical for browser module resolution)
    instruction += '\n\n**IMPORT PATH RULES (CRITICAL - Browser module resolution)**:';
    instruction += '\n- ALWAYS use relative paths for local files: "./components/Hero" or "../utils/helpers"';
    instruction += '\n- NEVER use bare specifiers like "src/components/Hero" - browsers cannot resolve these';
    instruction += '\n- For files in the same directory: "./FileName"';
    instruction += '\n- For files in subdirectories: "./subdir/FileName"';
    instruction += '\n- For files in parent directories: "../FileName" or "../../FileName"';
    instruction += '\n- NPM packages use bare specifiers: "react", "lucide-react", "@tanstack/react-query"';
    instruction += '\n- File extensions (.tsx, .ts) are optional in imports';

    // Error Fixing Guidelines
    instruction += '\n\n**ERROR FIXING GUIDELINES (When fixing runtime errors)**:';
    instruction += '\n- Carefully analyze the error message and stack trace to identify the root cause';
    instruction += '\n- Check for common issues: undefined variables, missing imports, incorrect prop types, async/await errors';
    instruction += '\n- Ensure all required imports are present at the top of the file';
    instruction += '\n- Verify that component props match their expected types';
    instruction += '\n- For TypeScript errors, ensure proper type annotations and null checks';
    instruction += '\n- When fixing, provide the COMPLETE updated file - do not use partial snippets or placeholders';
    instruction += '\n- After fixing, briefly explain what caused the error and how it was resolved';

    return instruction;
  };

  return {
    techStack,
    updateTechStack,
    resetTechStack,
    generateSystemInstruction
  };
};