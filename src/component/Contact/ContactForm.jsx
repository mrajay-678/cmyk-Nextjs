"use client"

import { useState } from "react"
import { CheckSquare, Layers, Mail, Pencil, Phone, Send, UserRound, Clock } from "lucide-react"

const initialForm = {
	name: "",
	email: "",
	phone: "",
	serviceType: "",
	quantity: "",
	timeline: "",
	projectDetails: "",
	privacy: false,
}

const inputClasses =
	"peer w-full border-0 border-b border-neutral-300 bg-transparent px-9 pb-3 pt-1 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-800 focus:border-pink-500"

const fields = [
	{ name: "name", label: "Name", type: "text", icon: UserRound, required: true },
	{ name: "email", label: "Email Address", type: "email", icon: Mail, required: true },
	{ name: "phone", label: "Phone", type: "tel", icon: Phone },
	{ name: "serviceType", label: "Service type", type: "text", icon: CheckSquare, required: true },
	{ name: "quantity", label: "Quantity", type: "text", icon: Layers },
	{ name: "timeline", label: "Timeline", type: "text", icon: Clock },
]

export default function ContactForm() {
	const [form, setForm] = useState(initialForm)
	const [status, setStatus] = useState({ type: "", message: "" })
	const [isSubmitting, setIsSubmitting] = useState(false)

	function updateField(event) {
		const { name, value, checked, type } = event.target
		setForm((current) => ({
			...current,
			[name]: type === "checkbox" ? checked : value,
		}))
	}

	async function handleSubmit(event) {
		event.preventDefault()
		setStatus({ type: "", message: "" })

		if (!form.privacy) {
			setStatus({ type: "error", message: "Please agree to the privacy policy before sending." })
			return
		}

		setIsSubmitting(true)

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data?.message || "Something went wrong. Please try again.")
			}

			setForm(initialForm)
			setStatus({ type: "success", message: "Thanks, your message has been sent." })
		} catch (error) {
			setStatus({
				type: "error",
				message: error instanceof Error ? error.message : "Something went wrong. Please try again.",
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="grid gap-x-8 gap-y-8 md:grid-cols-2">
			{fields.map(({ name, label, type, icon: Icon, required }) => (
				<label key={name} className="relative block">
					<Icon aria-hidden="true" className="absolute left-0 top-0.5 h-5 w-5 text-neutral-700" strokeWidth={1.8} />
					<span className="sr-only">{label}</span>
					<input
						className={inputClasses}
						type={type}
						name={name}
						value={form[name]}
						onChange={updateField}
						placeholder={label}
						required={required}
					/>
				</label>
			))}

			<label className="relative block md:col-span-2">
				<Pencil aria-hidden="true" className="absolute left-0 top-0.5 h-5 w-5 text-neutral-950" strokeWidth={2} />
				<span className="sr-only">Project details</span>
				<textarea
					className={`${inputClasses} min-h-16 resize-none`}
					name="projectDetails"
					value={form.projectDetails}
					onChange={updateField}
					placeholder="Project details"
					required
				/>
			</label>

			<div className="flex flex-col gap-4 pt-1 md:col-span-2 md:flex-row md:items-center">
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-pink-500 px-8 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(236,38,132,0.25)] transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-300 md:w-auto"
				>
					<Send aria-hidden="true" className="h-4 w-4" />
					{isSubmitting ? "Sending..." : "Get in Touch"}
				</button>

				<label className="flex items-center gap-3 text-sm text-neutral-500">
					<input
						type="checkbox"
						name="privacy"
						checked={form.privacy}
						onChange={updateField}
						className="h-4 w-4 rounded border-neutral-300 text-pink-500 focus:ring-pink-500"
					/>
					<span>
						I agree with the site&apos;s{" "}
						<a className="underline underline-offset-2" href="/privacy-policy">
							privacy policy
						</a>
						.
					</span>
				</label>
			</div>

			{status.message && (
				<p
					className={`rounded-full px-5 py-3 text-sm md:col-span-2 ${
						status.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
					}`}
					role="status"
				>
					{status.message}
				</p>
			)}
		</form>
	)
}
