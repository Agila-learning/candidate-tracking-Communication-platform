const maskPhone = (phone) => {
    if (!phone) return '';
    if (phone.length < 4) return '****';
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
};

module.exports = { maskPhone };
