import Logger from './logger-extended';

declare global {
  interface Window {
    __webui__?: {
      call(funcName: string, data?: string): Promise<string>;
    };
    WebUIBridge: WebUIBridge;
  }
}

interface Callback {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

class WebUIBridge {
  private callbacks = new Map<number, Callback>();
  private nextId = 1;
  private logger = Logger;

  callRustFunction(funcName: string, data: any = null): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.callbacks.set(id, { resolve, reject });

      this.logger.info(`Calling Rust function: ${funcName}`, {
        functionName: funcName,
        data: data,
        callId: id,
      });

      try {
        if (window.__webui__) {
          window.__webui__
            .call(funcName, JSON.stringify(data || {}))
            .then((result) => {
              this.logger.info(`Successfully called Rust function: ${funcName}`, {
                result: result,
                functionName: funcName,
              });
              resolve(JSON.parse(result));
            })
            .catch((error) => {
              this.logger.error(`Error calling Rust function ${funcName}: ${error.message}`, {
                functionName: funcName,
                error: error,
                data: data,
              });
              reject(error);
            });
        } else {
          this.logger.warn('WebUI not available, using simulated call', {
            functionName: funcName,
          });

          switch (funcName) {
            case 'open_folder':
              this.logger.info('Open folder operation completed successfully');
              resolve({
                success: true,
                path: '/home/user/images',
                images: [
                  { path: '/sample/image1.jpg', name: 'image1.jpg' },
                  { path: '/sample/image2.jpg', name: 'image2.jpg' },
                  { path: '/sample/image3.jpg', name: 'image3.jpg' },
                ],
              });
              break;
            case 'organize_images':
              this.logger.info('Images organized successfully');
              resolve({ success: true, message: 'Images organized successfully!' });
              break;
            case 'increment_counter':
              this.logger.debug(`Counter incremented to ${data?.value || 'unknown'}`, {
                value: data?.value,
                functionName: funcName,
              });
              resolve({ success: true, value: data?.value || 0 });
              break;
            case 'reset_counter':
              this.logger.debug(`Counter reset to ${data?.value || 'unknown'}`, {
                value: data?.value,
                functionName: funcName,
              });
              resolve({ success: true, value: data?.value || 0 });
              break;
            default:
              this.logger.warn(`Unknown function called: ${funcName}`);
              resolve({ success: true });
          }
        }
      } catch (error) {
        this.logger.error(`Error in Rust function call: ${(error as Error).message}`, {
          functionName: funcName,
          error: error,
          data: data,
        });
        reject(error);
      }
    });
  }

  handleResponse(response: any): void {
    this.logger.info('Received response from Rust backend', { response });
  }
}

window.WebUIBridge = new WebUIBridge();

export default window.WebUIBridge;