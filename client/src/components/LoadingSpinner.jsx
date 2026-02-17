const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-primary">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>
  );
};

export default LoadingSpinner;
