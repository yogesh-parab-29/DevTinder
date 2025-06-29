const validator = require("validator");
const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;

  if (!firstName || !lastName) {
    throw new Error("Name invalid");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Invalid email id");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Password is weak");
  }
};

const validateProfileEditData = (req) => {
  const editableFields = [
    "firstName",
    "lastName",
    "age",
    "about",
    "gender",
    "skills",
    "photoUrl"
  ];
  const isEditable = Object.keys(req.body).every((field) =>
    editableFields.includes(field)
  );
  return isEditable;
};

module.exports = {
  validateSignUpData,
  validateProfileEditData,
};
