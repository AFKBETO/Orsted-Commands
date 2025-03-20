export function isValidURL(input: string): boolean {
    if (
        /^(http(s):\/\/.)[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/g
            .test(input)
    ) {
        return true;
    }
    return false;
}
