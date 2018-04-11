var servizioPosta = require('nodemailer');
var ConfigEmail = require("./config/configEmail");

var emailSender = {
    sendEmail: function (destinatario, oggetto, testo, callback) {
        var postino = servizioPosta.createTransport({
            service: ConfigEmail.service,
            auth: {
                user: ConfigEmail.email,
                pass: ConfigEmail.password
            }
        });

        return postino.sendMail({
            from: ConfigEmail.nome,
            to: destinatario,
            subject: oggetto,
            text: testo
        }, callback);
    }
};

module.exports = emailSender;