/**
 * SmartStore Website Studio (CMS V3) — Forms & Service Widgets
 */

import React, { useState } from "react";
import { PageNode, RenderContext } from "../../types/cms-v3";
import { resolveComponentNode } from "../../renderer/contracts";
import { cn } from "@/lib/utils";
import { MapPin, Clock, Calendar, CheckCircle2, Send, Phone, Mail } from "lucide-react";

interface FormProps {
  node: PageNode;
  context: RenderContext;
  onSelectNode?: (nodeId: string) => void;
  isSelected?: boolean;
}

// 1. Contact Form Section
export function ContactFormSection({ node, context, onSelectNode, isSelected }: FormProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("py-12 px-4 max-w-xl mx-auto space-y-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm", isSelected && "ring-2 ring-indigo-500")}
    >
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-900">{(p.title as string) || "Get in Touch"}</h2>
        <p className="text-xs text-slate-500">{(p.subtitle as string) || "Have questions? Send us a message."}</p>
      </div>

      {submitted ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="font-bold">Thank you for your message!</p>
          <p>We will get back to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Your Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Message</label>
            <textarea
              rows={3}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="How can we help you?"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
            <Send className="w-3.5 h-3.5" /> Send Message
          </button>
        </form>
      )}
    </section>
  );
}

// 2. Location & Map Section
export function LocationMapSection({ node, context, onSelectNode, isSelected }: FormProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;

  const address = (p.address as string) || "123 Main Street, Suite 100, Cityville";
  const phone = (p.phone as string) || "+1 (555) 019-2834";
  const hours = (p.hours as string) || "Mon - Sun: 7:00 AM - 9:00 PM";

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("py-12 px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center", isSelected && "ring-2 ring-indigo-500")}
    >
      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Visit Our Location</h2>
        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>{address}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{hours}</span>
          </div>
        </div>
      </div>
      <div className="bg-slate-200 rounded-2xl h-64 flex items-center justify-center border border-slate-300 text-slate-500 text-xs">
        <MapPin className="w-8 h-8 text-slate-400 mb-2" />
        <span className="block text-center">Interactive Map View</span>
      </div>
    </section>
  );
}

// 3. Table Reservation Widget
export function ReservationWidgetSection({ node, context, onSelectNode, isSelected }: FormProps) {
  const resolution = resolveComponentNode(node, context);
  const p = resolution.resolvedProps;

  return (
    <section
      onClick={(e) => {
        if (onSelectNode) {
          e.stopPropagation();
          onSelectNode(node.id);
        }
      }}
      className={cn("py-12 px-4 max-w-2xl mx-auto bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-8 shadow-xl space-y-6", isSelected && "ring-2 ring-indigo-500")}
    >
      <div className="text-center space-y-1">
        <Calendar className="w-8 h-8 text-indigo-400 mx-auto" />
        <h2 className="text-2xl font-bold">Reserve a Table</h2>
        <p className="text-xs text-indigo-200">Book your dining experience in real-time</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="text-indigo-200 block mb-1">Guests</label>
          <select className="w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700">
            <option>2 Guests</option>
            <option>4 Guests</option>
            <option>6 Guests</option>
          </select>
        </div>
        <div>
          <label className="text-indigo-200 block mb-1">Date</label>
          <input type="date" className="w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700" />
        </div>
        <div>
          <label className="text-indigo-200 block mb-1">Time</label>
          <select className="w-full px-3 py-2 rounded bg-slate-800 text-white border border-slate-700">
            <option>6:00 PM</option>
            <option>7:00 PM</option>
            <option>8:00 PM</option>
          </select>
        </div>
      </div>

      <button className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition">
        Confirm Reservation
      </button>
    </section>
  );
}
