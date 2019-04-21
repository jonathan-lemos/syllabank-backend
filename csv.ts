import fs from "fs";

const tryNumber = (s: string): number | null => {
    try {
        return parseInt(s, 10);
    }
    catch (e) {
        try {
            return parseFloat(s);
        }
        catch (f) {
            return null;
        }
    }
};

export default async (filename: string, fields?: string[]): Promise<Array<{[index: string]: any}>> => {
    let file: string[] = fs.readFileSync(filename, "utf8").split("\n");

    if (fields === undefined) {
        fields = (file[0].split(/\s+/).map(s => s.trim()) as string[]);
        file = file.slice(1);
    }

    return file.map(line => {
        // typescript blows, so this line is necessary
        if (fields === undefined) {
            return Promise.reject(`Fields is somehow undefined`);
        }

        const entries: string[] = line.split(/\s+/).map(s => s.trim());
        const ret: {[index: string]: any} = {};

        if (entries.length !== fields.length) {
            return Promise.reject(`Line "${line}" does not match required fields ${fields.toString()}`)
        }

        for (let i = 0; i < entries.length; ++i) {
            let ent: any;
            const str = entries[i].trim();

            if (str.toLowerCase() === "null") {
                ent = null;
            }
            else if (tryNumber(str) !== null) {
                ent = tryNumber(str);
            }
            else if (str === "true") {
                ent = true;
            }
            else if (str === "false") {
                ent = false;
            }
            else {
                ent = str;
            }

            ret[fields[i]] = ent;
        }

        return ret;
    });
}
