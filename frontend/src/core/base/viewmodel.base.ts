// src/core/base/viewmodel.base.ts
// Base ViewModel class for MVVM pattern

import { signal, Signal, WritableSignal } from '@angular/core';

export interface ViewModelState {
  loading: boolean;
  error: string | null;
}

export abstract class BaseViewModel<TState extends ViewModelState = ViewModelState> {
  protected state: WritableSignal<TState>;
  
  abstract readonly stateSignal: Signal<TState>;
  
  protected abstract initState(): TState;
  
  constructor() {
    this.state = signal(this.initState());
  }
  
  get loading(): boolean {
    return this.stateSignal().loading;
  }
  
  get error(): string | null {
    return this.stateSignal().error;
  }
  
  protected setLoading(loading: boolean): void {
    this.state.set({ ...this.state(), loading });
  }
  
  protected setError(error: string | null): void {
    this.state.set({ ...this.state(), error });
  }
  
  protected clearError(): void {
    this.state.set({ ...this.state(), error: null });
  }
}
