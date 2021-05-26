const mapping = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};
const parseDevanagariDigits = (str) => {
  return [...str]
    .map((el) => {
      if (el in mapping) return (el = mapping[el]);
    })
    .join("");
};

module.exports = { parseDevanagariDigits };
