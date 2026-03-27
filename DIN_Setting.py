import pandas as pd


ski={"250 or less": [0.75, 1.00, 1.50, 1.75, 2.25, 2.75, 3.50, 0, 0, 0, 0, 0, 0, 0, 0], 
     "251-270":[0.75, 1.00, 1.25, 1.50, 2.00, 2.50, 3.00, 3.50, 4.50, 5.50, 6.50, 7.50, 0, 0, 0],
     "271-290":[0, 0.75, 1.00, 1.50, 1.75, 2.25, 2.75, 3.00, 4.00, 5.00, 6.00, 7.00, 8.50, 10.00, 11.50],
     "291-310":[0, 0, 0, 1.25, 1.50, 2.00, 2.50, 3.00, 3.50, 4.50, 5.50, 6.50, 8.00, 9.50, 11.00],
     "311-330":[0, 0, 0, 0, 1.50, 1.75, 2.25, 2.75, 3.50, 4.00, 5.00, 6.00, 7.00, 8.50, 10.00],
     "330 or more":[0, 0, 0, 0, 0, 1.75, 2.00, 2.50, 3.00, 3.50, 4.50, 5.50, 6.50, 8.00, 9.50]}

df=pd.DataFrame(data=ski)

print(df)

codes = list("ABCDEFGHIJKLMNO")

df = pd.DataFrame(ski, index=codes)


weight_codes = {
(10,13):"A",
(14,17):"B",
(18,21):"C",
(22,25):"D",
(26,30):"E",
(31,35):"F",
(36,41):"G",
(42,48):"H",
(49,57):"I",
(58,66):"J",
(67,78):"K",
(79,94):"L",
(95,995):"M",
(996,997):"N",
(998,999):"O"
}

def get_code(weight):
    for (low,high),code in weight_codes.items():
        if low <= weight <= high:
            return code
        


def get_boot_col(boot):
    if boot <= 250:
        return "250 or less"
    elif boot <= 270:
        return "251-270"
    elif boot <= 290:
        return "271-290"
    elif boot <= 310:
        return "291-310"
    elif boot <= 330:
        return "311-330"
    else:
        return "330 or more"
    


def adjust_code(code, age, skier_type):
    
    idx = codes.index(code)

    # age adjustment
    if age < 9 or age > 50:
        idx -= 1

    # skier type adjustment
    if skier_type == 2:
        idx += 1
    elif skier_type == 3:
        idx += 2

    # keep index inside table
    idx = max(0, min(idx, len(codes)-1))

    return codes[idx]





import re

def parse_weight(weight_input):
    
    text = str(weight_input).lower()

    # extract number
    number = float(re.findall(r"\d+\.?\d*", text)[0])

    # detect pounds
    if "lb" in text or "pound" in text:
        number = number * 0.453592

    return number


def get_din(weight, boot, age, skier_type):

    weight = parse_weight(weight)

    code = get_code(weight)
    code = adjust_code(code, age, skier_type)
    col = get_boot_col(boot)

    return df.loc[code, col]




get_din(weight="170 lbs", boot=290, age=21, skier_type=3)