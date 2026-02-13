const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_MIN = process.env.JWT_EXPIRES_MIN ? Number(process.env.JWT_EXPIRES_MIN) : 30;
const JWT_MAX_HOURS = process.env.JWT_MAX_HOURS ? Number(process.env.JWT_MAX_HOURS) : 24;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_MIN,
  JWT_MAX_HOURS,
  PASSWORD_REGEX
};
