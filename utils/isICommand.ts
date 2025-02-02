import { ICommand } from '../interfaces/ICommand.ts';

/**
 * Type guard for ICommand
 * @param object any
 * @returns boolean
 */
// deno-lint-ignore no-explicit-any -- This is a type guard, so it needs to be any
export function isICommand(object: any): object is ICommand {
    return 'data' in object && 'execute' in object;
}
