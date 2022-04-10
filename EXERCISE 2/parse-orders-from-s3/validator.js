// I can add all file validations here based on project needs

/**
 * @param string contentType
 * returns boolean
 */
exports.fileValidation = async (contentType) => {
  if (contentType === "text/csv") {
    return true;
  }
  return false;
};
