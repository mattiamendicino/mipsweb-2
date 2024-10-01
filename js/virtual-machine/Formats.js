import { Utils } from "./Utils.js";
export class R_Format {
    assemble(parts, instruction, cpu) {
        let basic;
        let rs = cpu.registers.get('$zero');
        let rt = cpu.registers.get('$zero');
        let rd = cpu.registers.get('$zero');
        let shamt = 0;
        const opcode = instruction.opcode;
        const funct = instruction.funct;
        if (instruction.symbol === 'MULT' || instruction.symbol === 'MULTU' || instruction.symbol === 'DIV') {
            // OP rs, rt
            rs = cpu.registers.get(parts[1]);
            rt = cpu.registers.get(parts[2]);
            if (!rs || !rt) {
                throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
            }
            basic = `${instruction.symbol.toLowerCase()} $${rs.number} $${rt.number}`;
        }
        else if (instruction.symbol === 'MFLO' || instruction.symbol === 'MFHI') {
            // Formato: OP rd
            rd = cpu.registers.get(parts[1]);
            if (!rd) {
                throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
            }
            basic = `${instruction.symbol.toLowerCase()} $${rd.number}`;
        }
        else if (instruction.symbol === 'SLL' || instruction.symbol === 'SRL' || instruction.symbol === 'SRA') {
            // OP rd, rt, shamt
            rd = cpu.registers.get(parts[1]);
            rt = cpu.registers.get(parts[2]);
            shamt = Number(parts[3]);
            if (!rd || !rt || isNaN(shamt)) {
                throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
            }
            basic = `${instruction.symbol.toLowerCase()} $${rd.number} $${rt.number} ${shamt}`;
        }
        else {
            // OP rd, rs, rt
            rd = cpu.registers.get(parts[1]);
            rs = cpu.registers.get(parts[2]);
            rt = cpu.registers.get(parts[3]);
            if (!rd || !rs || !rt) {
                throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
            }
            basic = `${instruction.symbol.toLowerCase()} $${rd.number} $${rs.number} $${rt.number}`;
        }
        let code = 0;
        code = Utils.setBits(code, opcode, 31, 26);
        code = Utils.setBits(code, rs.number, 25, 21);
        code = Utils.setBits(code, rt.number, 20, 16);
        code = Utils.setBits(code, rd.number, 15, 11);
        code = Utils.setBits(code, shamt, 10, 6);
        code = Utils.setBits(code, funct, 5, 0);
        return {
            code,
            basic
        };
    }
    disassemble(instructionCode) {
        const opcode = Utils.getBits(instructionCode, 31, 26);
        const rs = Utils.getBits(instructionCode, 25, 21);
        const rt = Utils.getBits(instructionCode, 20, 16);
        const rd = Utils.getBits(instructionCode, 15, 11);
        const shamt = Utils.getBits(instructionCode, 10, 6);
        const funct = Utils.getBits(instructionCode, 5, 0);
        return { opcode, rs, rt, rd, shamt, funct };
    }
}
export class I_Format {
    assemble(parts, instruction, cpu) {
        let basic;
        let rs = cpu.registers.get('$zero');
        let rt = cpu.registers.get('$zero');
        let immediate = 0;
        const opcode = instruction.opcode;
        if (instruction.symbol === 'LUI') {
            // OP rt, immediate
            rt = cpu.registers.get(parts[1]);
            immediate = Number(parts[2]);
            rs = cpu.registers.get('$zero');
            if (!rt || isNaN(immediate)) {
                throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
            }
            basic = `${instruction.symbol.toLowerCase()} $${rt.number} ${immediate}`;
        }
        else if (instruction.symbol === 'LW' || instruction.symbol === 'SW') {
            // OP rt, offset(rs)
            rt = cpu.registers.get(parts[1]);
            const offsetRs = parts[2];
            const openParenIndex = offsetRs.indexOf('(');
            const closeParenIndex = offsetRs.indexOf(')');
            if (openParenIndex === -1 || closeParenIndex === -1) {
                throw new Error(`Invalid address format for instruction ${parts.join(' ')}`);
            }
            const offsetStr = offsetRs.substring(0, openParenIndex).trim();
            let rsStr = offsetRs.substring(openParenIndex + 1, closeParenIndex).trim();
            immediate = Number(offsetStr);
            if (!rsStr.startsWith('$')) {
                rsStr = `$${rsStr}`;
            }
            rs = cpu.registers.get(rsStr);
            if (!rt || !rs || isNaN(immediate)) {
                throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
            }
            basic = `${instruction.symbol.toLowerCase()} $${rt.number} ${immediate}($${rs.number})`;
        }
        else {
            // OP rt, rs, immediate
            rt = cpu.registers.get(parts[1]);
            rs = cpu.registers.get(parts[2]);
            immediate = Number(parts[3]);
            if (!rt || !rs || isNaN(immediate)) {
                throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
            }
            basic = `${instruction.symbol.toLowerCase()} $${rt.number} $${rs.number} ${immediate}`;
        }
        let code = 0;
        code = Utils.setBits(code, opcode, 31, 26);
        code = Utils.setBits(code, rs.number, 25, 21);
        code = Utils.setBits(code, rt.number, 20, 16);
        code = Utils.setBits(code, Utils.asSigned(immediate, 16), 15, 0);
        return {
            code,
            basic
        };
    }
    disassemble(instructionCode) {
        const opcode = Utils.getBits(instructionCode, 31, 26);
        const rs = Utils.getBits(instructionCode, 25, 21);
        const rt = Utils.getBits(instructionCode, 20, 16);
        const immediate = Utils.asSigned(Utils.getBits(instructionCode, 15, 0), 16);
        return { opcode, rs, rt, immediate };
    }
}
export class J_Format {
    assemble(parts, instruction, cpu) {
        const address = Number(parts[1]);
        if (isNaN(address))
            throw new Error(`Invalid params for instruction ${parts.join(' ')}`);
        const jumpAddress = (address >>> 2) & 0x03FFFFFF;
        let code = 0;
        code = Utils.setBits(code, instruction.opcode, 31, 26);
        code = Utils.setBits(code, jumpAddress, 25, 0);
        const basic = `${parts[0]} ${address}`;
        return {
            code,
            basic
        };
    }
    disassemble(instructionCode) {
        const opcode = Utils.getBits(instructionCode, 31, 26);
        const address = Utils.getBits(instructionCode, 25, 0);
        return { opcode, address };
    }
}
