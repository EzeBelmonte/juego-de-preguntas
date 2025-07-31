// Se verifica si existe el código
export function generateCode(existingCodes) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code
    do {
        code = Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
    } while (existingCodes.has(code))
    return code
}