export const isSuspiciousText = (text) => {
    const numberWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const numerals = Array.from({ length: 10 }, (_, i) => i.toString());

    let count = 0;

    // Check for number words
    numberWords.concat(numerals).forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        count += (matches ? matches.length : 0);
    });

    // Check for continuous sequences of digits
    const continuousDigitsRegex = /\b\d{5,}\b/g; // adjust the number 5 to set minimum length of digits sequence
    const continuousDigitsMatches = text.match(continuousDigitsRegex);
    if (continuousDigitsMatches) {
        return true; // return true if any continuous sequence of digits is found
    }

    return count > 4;
}
