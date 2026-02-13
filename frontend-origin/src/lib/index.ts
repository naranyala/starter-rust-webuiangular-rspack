export { Container, container, inject, singleton, transient } from '../shared/utils/di';
export { logger as Logger } from '../shared/utils/logger';
export { default as WebUIBridge } from '../shared/utils/webui-bridge';

import { container } from '../shared/utils/di';
import { logger as Logger } from '../shared/utils/logger';
import WebUIBridge from '../shared/utils/webui-bridge';

container().registerInstance('logger', Logger);
container().registerInstance('webuiBridge', WebUIBridge);