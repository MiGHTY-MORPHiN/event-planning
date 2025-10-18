export const formatCurrency = (value) => {
    if (value == null) return "R0";
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatNumber = (value) => {
    if (value == null) return "0";
    return new Intl.NumberFormat("en-ZA").format(value);
};