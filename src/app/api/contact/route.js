import nodemailer from "nodemailer"

const requiredFields = ["name", "email", "serviceType", "projectDetails"]

function clean(value) {
	return typeof value === "string" ? value.trim() : ""
}

function isEmail(value) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function escapeHtml(value) {
	return value.replace(/[&<>"']/g, (character) => {
		const entities = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			'"': "&quot;",
			"'": "&#39;",
		}

		return entities[character]
	})
}

function getTransporter() {
	const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env

	if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
		throw new Error("Email service is not configured.")
	}

	return nodemailer.createTransport({
		host: SMTP_HOST,
		port: Number(SMTP_PORT),
		secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
		auth: {
			user: SMTP_USER,
			pass: SMTP_PASS,
		},
	})
}

export async function POST(request) {
	let body

	try {
		body = await request.json()
	} catch {
		return Response.json({ message: "Invalid request body." }, { status: 400 })
	}

	const contact = {
		name: clean(body.name),
		email: clean(body.email),
		phone: clean(body.phone),
		serviceType: clean(body.serviceType),
		quantity: clean(body.quantity),
		timeline: clean(body.timeline),
		projectDetails: clean(body.projectDetails),
		privacy: Boolean(body.privacy),
	}

	const missingField = requiredFields.find((field) => !contact[field])
	if (missingField) {
		return Response.json({ message: "Please fill in all required fields." }, { status: 400 })
	}

	if (!isEmail(contact.email)) {
		return Response.json({ message: "Please enter a valid email address." }, { status: 400 })
	}

	if (!contact.privacy) {
		return Response.json({ message: "Please agree to the privacy policy." }, { status: 400 })
	}

	try {
		const transporter = getTransporter()
		const to = process.env.CONTACT_TO_EMAIL || "hello@cmykprint.shop"
		const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER
		const safeContact = Object.fromEntries(
			Object.entries(contact).map(([key, value]) => [key, typeof value === "string" ? escapeHtml(value) : value])
		)

		await transporter.sendMail({
			from,
			to,
			replyTo: contact.email,
			subject: `New contact request from ${contact.name}`,
			text: [
				`Name: ${contact.name}`,
				`Email: ${contact.email}`,
				`Phone: ${contact.phone || "Not provided"}`,
				`Service type: ${contact.serviceType}`,
				`Quantity: ${contact.quantity || "Not provided"}`,
				`Timeline: ${contact.timeline || "Not provided"}`,
				"",
				"Project details:",
				contact.projectDetails,
			].join("\n"),
			html: `
				<h2>New contact request</h2>
				<p><strong>Name:</strong> ${safeContact.name}</p>
				<p><strong>Email:</strong> ${safeContact.email}</p>
				<p><strong>Phone:</strong> ${safeContact.phone || "Not provided"}</p>
				<p><strong>Service type:</strong> ${safeContact.serviceType}</p>
				<p><strong>Quantity:</strong> ${safeContact.quantity || "Not provided"}</p>
				<p><strong>Timeline:</strong> ${safeContact.timeline || "Not provided"}</p>
				<p><strong>Project details:</strong></p>
				<p>${safeContact.projectDetails.replace(/\n/g, "<br />")}</p>
			`,
		})

		return Response.json({ message: "Message sent successfully." })
	} catch (error) {
		console.error("Contact email failed:", error)
		return Response.json({ message: "Email could not be sent right now." }, { status: 500 })
	}
}
