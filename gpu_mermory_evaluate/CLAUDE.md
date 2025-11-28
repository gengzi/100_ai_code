# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **frontend React application** for AI model GPU memory estimation and hardware recommendation. The application helps users calculate memory requirements and performance metrics for AI models (LLM, CV, Audio, Multimodal) and provides GPU configuration suggestions.

## Development Commands

```bash
# Development server (runs on port 3003)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

**Note**: The application is configured to run on port 3003 by default to avoid conflicts with other local development servers.

## Architecture Overview

### Current Simplified Architecture
The codebase has been recently simplified to a minimal architecture:

- **Pure Frontend**: React + TypeScript + Vite build system
- **Minimal Dependencies**: Only React, React Router, and Ant Design for UI
- **Simple State Management**: Basic React state (no complex state management libraries)
- **Inline Styling**: Simple inline styles and basic CSS (no Tailwind, PostCSS, or complex styling)
- **Two Main Pages**: Home page and Estimator page

### Key Files Structure
```
src/
├── main.tsx              # Application entry point
├── App.tsx              # Main app with routing (Home, Estimator)
├── index.css            # Basic global styles
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── Home/           # Landing page
│   └── Estimator/      # Main estimation interface
├── stores/             # State management (currently minimal)
├── utils/              # Business logic and calculations
├── types/              # TypeScript type definitions
└── styles/             # Styling files
```

## Core Business Logic

### Memory Calculation Engine
Located in `src/utils/modelCalculations.ts`, this handles:
- Model weights memory calculation based on parameters and precision
- Activation memory estimation for different model types
- KV cache calculations for LLM models
- Training mode memory overhead (gradients, optimizers)

### GPU Database
Located in `src/utils/gpuDatabase.ts`, contains comprehensive GPU specifications:
- 20+ NVIDIA, AMD, and Intel GPUs
- Memory capacity, bandwidth, TFLOPS specifications
- Price and power consumption data
- Compatibility filtering and recommendation logic

## Development Guidelines

### Code Style
- **TypeScript**: Strict typing throughout the codebase
- **Functional Components**: Use React functional components with hooks
- **Inline Styles**: Prefer inline styles or basic CSS over complex styling systems
- **Path Aliases**: Use `@/` prefix for imports from src directory

### Component Patterns
```typescript
// Standard component structure
interface ComponentProps {
  // Props with TypeScript interfaces
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX with Ant Design components
  );
};

export default Component;
```

### Error Handling
- Use try-catch blocks for async operations
- Provide user-friendly error messages using Ant Design's message component
- Handle edge cases gracefully

## Configuration Details

### Vite Configuration
- **Development Port**: 3003 (configured in vite.config.ts)
- **Host**: Set to '0.0.0.0' for network access
- **Auto-open**: Browser opens automatically on start

### Dependencies (Current Minimal Set)
- React 18.2.0 + TypeScript 5.2.2
- React Router DOM 6.8.0 for routing
- Ant Design 5.12.8 for UI components
- Vite 5.0.8 for build tooling

## Historical Context

The project was recently simplified from a more complex architecture that included:
- Tailwind CSS (removed in favor of basic styling)
- Zustand for state management (removed for simpler React state)
- React Query (removed as there's no server communication)
- ESLint, Prettier, and other development tools (removed for simplicity)
- Complex CSS architecture (simplified to basic CSS and inline styles)

This simplification was done to resolve build and deployment issues while maintaining core functionality.

## Testing

Currently, no test framework is configured. The application focuses on core functionality with a simple, maintainable structure.

## Key Features Implemented

1. **Model Selection**: Support for LLM, CV, Audio, and Multimodal models
2. **Parameter Configuration**: Customizable model parameters
3. **Memory Calculation**: Real-time memory usage estimation
4. **GPU Recommendations**: Hardware suggestions based on requirements
5. **Performance Estimation**: Expected output metrics for different GPU configurations

## Future Development

When extending the application:
- Maintain the simplified architecture approach
- Prefer Ant Design components over custom styling
- Keep TypeScript interfaces strict and comprehensive
- Follow the existing file organization patterns
- Test changes thoroughly with the simplified dependency set
- 让我自己启动项目就行