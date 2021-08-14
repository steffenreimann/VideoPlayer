function map(value, inputMin, inputMax, outputMin, outputMax) {
    return outputMin + (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin);
}