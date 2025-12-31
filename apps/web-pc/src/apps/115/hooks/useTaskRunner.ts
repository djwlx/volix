export interface TaskRunnerParams<T> {
  task: (param?: T) => Promise<any>;
}

function useTaskRunner<T = any>() {
  const start = (param?: T) => {
    console.log('param', param);
  };

  return {
    start,
  };
}
export default useTaskRunner;
