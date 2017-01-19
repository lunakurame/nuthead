# Nuthead script interpreter

## Description

Nuthead is an interpreter for the scripts used to animate entities (and in the future,
to script NPCs and interactions with other objects).

## Example

```json
[
	"log Hello world!",
	"nop",
	"set view master 0",
	"nop 500",
	"set frame 1",
	"nop 200",
	"set view loopy",
	"",
	"# this is a comment",
	"lbl loop",
	"set frame 2",
	"nop 100",
	"set frame 3",
	"nop 100",
	"jmp loop"
]
```

## Specification

Nuthead reads the script line by line from an array of strings, each line is an
element of the array.

### Ignored lines:

- empty lines,
- lines containing only whitespace,
- lines starting with `#`,
- lines starting with any number of whitespace characters followed by `#`.

Whitespace is whatever your JavaScript interpreter thinks it is. If in doubt,
check the documentation of `String.prototype.trim()`. Ignored lines still count
for line numbering (eg. when you jump to a specified line number). During script
execution, Nuthead just immediately jumps to the next line if the current line
matches any of the rules for ignored lines.

### Instructions:

- `lbl PARAM1`  
Sets a label named `PARAM1`, then jumps to the next instruction.
- `log PARAM1`  
Logs `PARAM1` to the JavaScript console, then jumps to the next instruction.
- `jmp PARAM1`  
If `PARAM1` is not defined, throws warning to the JavaScript console.
If `PARAM1` is numeric, jumps to the line `PARAM1` of the script.
Otherwise, tries to find the first occurence of label `PARAM1` in the script. If
found, jumps to that line, if not, throws a warning.
- `nop PARAM1`  
If `PARAM1` is not defined or is not numeric, jumps to the next instruction.
Otherwise, waits for `PARAM1` milliseconds, then jumps to the next instruction.
- `set PARAM1 PARAM2 PARAM3`  
If `PARAM1` is not defined, throws a warning, then jumps to the next
instruction.
If `PARAM1` equals `view`, sets view `PARAM2` and frame `PARAM3`.
If `PARAM1` equals `frame`, sets frame `PARAM2`.
If `PARAM2` or `PARAM3` is not defined, the currently set view or frame will be
reloaded. If not set, the defaults will be loaded (view `master`, frame `0`). At
the end, always jumps to the next instruction.
- Any other instructions throw a warning to the console and jump to the next
instruction.