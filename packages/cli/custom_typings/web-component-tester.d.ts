declare module '@polymer-tools/web-component-tester' {
  module wct {
    interface CLI {
      // TODO(justinfagnani): how do you import an interface into a .d.ts file?
      run(env: any, args: string[], stdout: any /*Stream*/): Promise<void>;
    }
    let cli : CLI;
  }

  export = wct;
}
