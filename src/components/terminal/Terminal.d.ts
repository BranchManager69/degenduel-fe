import { Config } from '../../config';
export interface TerminalProps {
    config: Config;
    onCommandExecuted?: (command: string, response: string) => void;
    onTerminalExit?: () => void;
    showTerminal?: boolean;
}
export declare function Terminal({ config, onCommandExecuted, onTerminalExit, showTerminal }: TerminalProps): import("react/jsx-runtime").JSX.Element;
