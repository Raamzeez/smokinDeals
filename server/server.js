const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const stripe = require('stripe')(process.env.SECRET_KEY)
const cors = require('cors')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer')

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const PORT = process.env.PORT || 5000

const transporter = nodemailer.createTransport({
	service: 'outlook',
	auth: {
		user: 'springfieldsmokindeals@outlook.com',
		pass: 'Change_Password_Later',
	},
})

const sendEmailToClient = (email) => {
	const mailOptions = {
		from: 'springfieldsmokindeals@outlook.com',
		to: email,
		subject: "Congrats! Your purchase using Smokin Deals' online store was successful!",
		text:
			'You can email at springfieldsmokindeals@outlook.com or call (413) 237-9574 for more information regarding the status of your order, or for a refund',
	}

	transporter.sendMail(mailOptions, (err, info) => {
		err ? console.error(err) : console.log('Email sent: ' + info.response)
	})
}

app.post('/checkout', async (req, res) => {
	try {
		const { lineOfItems, customerEmail } = req.body

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			billing_address_collection: 'required',
			shipping_address_collection: {
				allowed_countries: ['US'],
			},
			customer_email: customerEmail,
			line_items: lineOfItems,
			mode: 'payment',
			success_url:
				'http://localhost:3000/cart?session_id={CHECKOUT_SESSION_ID}&stripeStatus=success', //Verify URL
			cancel_url: 'http://localhost:3000/cart?stripeStatus=cancelled', //Verify URL
		})

		sendEmailToClient(customerEmail)

		return res.status(200).send({
			error: null,
			session_id: session.id,
		})
	} catch (err) {
		console.error(err)

		return res.status(400).send({
			error: 'Error in processing checkout',
			session_id: null,
		})
	}
})

app.listen(PORT, () => {
	console.log('App listening on port', PORT)
})
