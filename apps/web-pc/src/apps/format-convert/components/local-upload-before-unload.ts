const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
  event.preventDefault();
  event.returnValue = true;
  return true;
};

export const attachLocalUploadBeforeUnloadGuard = () => {
  window.addEventListener('beforeunload', beforeUnloadHandler);
  return () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  };
};
