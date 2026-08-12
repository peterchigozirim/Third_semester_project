@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 active:scale-95;
  }
  
  .btn-secondary {
    @apply bg-secondary-600 text-white hover:bg-secondary-700 active:scale-95;
  }
  
  .btn-outline {
    @apply border-2 border-gray-300 text-gray-700 hover:border-primary-600 hover:text-primary-600 active:scale-95;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-md overflow-hidden;
  }
  
  .input {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all;
  }
  
  .label {
    @apply block text-sm font-medium text-gray-700 mb-2;
  }
}
