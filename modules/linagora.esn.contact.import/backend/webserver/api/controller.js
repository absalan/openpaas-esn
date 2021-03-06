'use strict';

module.exports = function(dependencies, lib) {

  function importContacts(req, res) {
    lib.import.importAccountContactsByJobQueue(req.user, req.account);
    return res.status(202).end();
  }

  return {
    importContacts: importContacts
  };

};
