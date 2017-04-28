# Compares the output of my emulator with the 'golden log' (ignore illegal opcodes)

lineNumber = 0
errorCount = 0
with open('cpu.log') as cpuLog, open('nestest.log') as testLog:
    for cpu, test in zip(cpuLog, testLog):
        error = False
        cycSubtract = 0
        cpu = cpu.rstrip()
        test = test.rstrip()
        cpuArr = [i for i in cpu.split(" ") if i]
        testArr = [i for i in test.split(" ") if i]
        if cpuArr[-2] == "CYC:":
            error = error or cpuArr[-1] != testArr[-1]
            cycSubtract = 1
        else:
            error = error or cpuArr[-1] != testArr[-1]
        error = error or cpuArr[0].upper() != testArr[0].upper() or \
            cpuArr[1].upper() != testArr[-6-cycSubtract].upper() or \
            cpuArr[2].upper() != testArr[-5-cycSubtract].upper() or \
            cpuArr[3].upper() != testArr[-4-cycSubtract].upper() or \
            cpuArr[4].upper() != testArr[-3-cycSubtract].upper() or \
            cpuArr[5].upper() != testArr[-2-cycSubtract].upper()



        lineNumber += 1
        if error:
            print "error in line: " + str(lineNumber)
            print cpu
            print test
            errorCount += 1
        if errorCount == 10:
            break

