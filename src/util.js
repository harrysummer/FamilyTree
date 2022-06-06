export function zhNumber(number) {
    var base = "零一二三四五六七八九";
    var exp10 = "十百千";
    var exp1000 = "万亿";
    if (number < 10) {
        return base[number];
    } else if (number < 20) {
        return exp10[0] + (number % 10 ? base[number % 10] : "");
    } else if (number < 100) {
        return base[Math.floor(number / 10)] + zhNumber(10 + number % 10);
    } else return "ERR";
};

export function zhGeneration(generation) {
    return generation === 0 ? '始祖' : zhNumber(generation + 1) + '世';
};
