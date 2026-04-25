interface EmailTemplate {
  html: string;
  text: string;
}

interface EmailLayoutInput {
  title: string;
  intro: string;
  lines?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}

interface Party {
  name?: string;
  email?: string;
}

interface JourneyDetails {
  requesterName?: string;
  pickup?: string;
  drop?: string;
  city?: string;
  date?: string;
  vehicleNo?: string;
  driverName?: string;
  contact?: string;
  otp?: string;
  cost?: number;
}

function renderLayout({ title, intro, lines = [], ctaLabel, ctaUrl, footer }: EmailLayoutInput): EmailTemplate {
  const safeLines = lines.filter(Boolean);
  const footerText = footer || 'This is an automated TTMS notification.';
  const htmlLines = safeLines.map((line) => `<li style="margin:0 0 8px;">${line}</li>`).join('');
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#020617;padding:32px;color:#e2e8f0;">
      <div style="max-width:640px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:14px;overflow:hidden;">
        <div style="padding:28px 32px;border-bottom:1px solid #1e293b;">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">TTMS Notification</div>
          <h1 style="margin:0;font-size:28px;line-height:1.2;color:#f8fafc;">${title}</h1>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#cbd5e1;">${intro}</p>
          ${safeLines.length ? `<ul style="margin:0 0 20px;padding-left:20px;color:#e2e8f0;line-height:1.7;">${htmlLines}</ul>` : ''}
          ${ctaLabel && ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">${ctaLabel}</a>` : ''}
        </div>
        <div style="padding:18px 32px;border-top:1px solid #1e293b;color:#94a3b8;font-size:12px;line-height:1.6;">${footerText}</div>
      </div>
    </div>
  `;
  const text = [title, '', intro, ...safeLines.map((line) => `- ${line}`), ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : '', '', footerText]
    .filter(Boolean)
    .join('\n');

  return { html, text };
}

function formatCurrency(cost?: number) {
  if (typeof cost !== 'number') return 'N/A';
  return `$${cost.toFixed(2)}`;
}

function formatPartyName(party?: Party) {
  return party?.name || party?.email || 'TTMS user';
}

export function accountProvisionedTemplate(user: Party & { username: string; role: string }, password?: string, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'Your TTMS account is ready',
    intro: `Hello ${formatPartyName(user)}, your TTMS access has been provisioned successfully.`,
    lines: [
      `Username: ${user.username}`,
      `Role: ${user.role}`,
      password ? `Temporary password: ${password}` : '',
      'For security, please sign in and update your password if your deployment supports password changes.',
    ],
    ctaLabel: loginUrl ? 'Open TTMS' : undefined,
    ctaUrl: loginUrl,
  });
}

export function accountUpdatedTemplate(user: Party & { username: string }, changes: string[], loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'Your TTMS account was updated',
    intro: `Hello ${formatPartyName(user)}, your account details were updated by an administrator.`,
    lines: [
      `Username: ${user.username}`,
      ...changes,
    ],
    ctaLabel: loginUrl ? 'Review account' : undefined,
    ctaUrl: loginUrl,
  });
}

export function rideRequestedTemplate(user: Party, journey: JourneyDetails, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'Transport request received',
    intro: `Hello ${formatPartyName(user)}, your TTMS journey request has been created successfully.`,
    lines: [
      `Pickup: ${journey.pickup || 'N/A'}`,
      `Drop: ${journey.drop || 'N/A'}`,
      `City: ${journey.city || 'N/A'}`,
      `Journey date: ${journey.date || 'N/A'}`,
      'You will receive another notification once a vendor assigns a driver.',
    ],
    ctaLabel: loginUrl ? 'Track request' : undefined,
    ctaUrl: loginUrl,
  });
}

export function vendorQueueTemplate(vendor: Party, journey: JourneyDetails, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'New dispatch request in your queue',
    intro: `Hello ${formatPartyName(vendor)}, a new TTMS request is awaiting vendor assignment in your operating city.`,
    lines: [
      `Requester: ${journey.requesterName || 'N/A'}`,
      `Pickup: ${journey.pickup || 'N/A'}`,
      `Drop: ${journey.drop || 'N/A'}`,
      `Journey date: ${journey.date || 'N/A'}`,
    ],
    ctaLabel: loginUrl ? 'Open dispatch queue' : undefined,
    ctaUrl: loginUrl,
  });
}

export function rideAssignedTemplate(user: Party, journey: JourneyDetails, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'Your ride has been assigned',
    intro: `Hello ${formatPartyName(user)}, a transport has been assigned to your TTMS request.`,
    lines: [
      `Vehicle: ${journey.vehicleNo || 'N/A'}`,
      `Driver: ${journey.driverName || 'N/A'}`,
      `Contact: ${journey.contact || 'N/A'}`,
      `Pickup: ${journey.pickup || 'N/A'}`,
      `Drop: ${journey.drop || 'N/A'}`,
      `Journey date: ${journey.date || 'N/A'}`,
    ],
    ctaLabel: loginUrl ? 'View ride details' : undefined,
    ctaUrl: loginUrl,
  });
}

export function driverAssignedTemplate(user: Party, journey: JourneyDetails, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'A journey has been assigned to you',
    intro: `Hello ${formatPartyName(user)}, a new TTMS journey has been assigned to your vehicle.`,
    lines: [
      `Pickup: ${journey.pickup || 'N/A'}`,
      `Drop: ${journey.drop || 'N/A'}`,
      `Passenger: ${journey.requesterName || 'N/A'}`,
      `Journey date: ${journey.date || 'N/A'}`,
      `Vehicle: ${journey.vehicleNo || 'N/A'}`,
    ],
    ctaLabel: loginUrl ? 'Open driver dashboard' : undefined,
    ctaUrl: loginUrl,
  });
}

export function rideStartedTemplate(user: Party, journey: JourneyDetails, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'Your journey is in progress',
    intro: `Hello ${formatPartyName(user)}, your TTMS journey has started.`,
    lines: [
      `Vehicle: ${journey.vehicleNo || 'N/A'}`,
      `Driver: ${journey.driverName || 'N/A'}`,
      `Completion OTP: ${journey.otp || 'N/A'}`,
      'Please share the OTP with the driver only when you reach your destination.',
    ],
    ctaLabel: loginUrl ? 'View journey status' : undefined,
    ctaUrl: loginUrl,
  });
}

export function rideCompletedTemplate(user: Party, journey: JourneyDetails, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'Your journey has been completed',
    intro: `Hello ${formatPartyName(user)}, your TTMS journey has been completed successfully.`,
    lines: [
      `Pickup: ${journey.pickup || 'N/A'}`,
      `Drop: ${journey.drop || 'N/A'}`,
      `Vehicle: ${journey.vehicleNo || 'N/A'}`,
      `Fare: ${formatCurrency(journey.cost)}`,
    ],
    ctaLabel: loginUrl ? 'Review journey history' : undefined,
    ctaUrl: loginUrl,
  });
}

export function vendorJourneyCompletedTemplate(vendor: Party, journey: JourneyDetails, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'A fleet journey was completed',
    intro: `Hello ${formatPartyName(vendor)}, a journey assigned to your fleet has been completed and is ready for invoicing.`,
    lines: [
      `Passenger: ${journey.requesterName || 'N/A'}`,
      `Vehicle: ${journey.vehicleNo || 'N/A'}`,
      `Route: ${journey.pickup || 'N/A'} to ${journey.drop || 'N/A'}`,
      `Fare: ${formatCurrency(journey.cost)}`,
    ],
    ctaLabel: loginUrl ? 'View ticket history' : undefined,
    ctaUrl: loginUrl,
  });
}

export function invoiceGeneratedTemplate(vendor: Party, month: number, year: number, totalCost: number, loginUrl?: string): EmailTemplate {
  return renderLayout({
    title: 'Your TTMS invoice is ready',
    intro: `Hello ${formatPartyName(vendor)}, a new invoice has been generated for your fleet.`,
    lines: [
      `Billing period: ${month}/${year}`,
      `Total amount: ${formatCurrency(totalCost)}`,
      'The invoice PDF is attached to this email.',
    ],
    ctaLabel: loginUrl ? 'Open invoices' : undefined,
    ctaUrl: loginUrl,
  });
}

export function passwordResetTemplate(user: Party, resetUrl: string): EmailTemplate {
  return renderLayout({
    title: 'Reset your TTMS password',
    intro: `Hello ${formatPartyName(user)}, we received a request to reset your TTMS password.`,
    lines: [
      'Use the secure reset link below to choose a new password.',
      'For security, this link expires in 30 minutes.',
      'If you did not request a password reset, you can safely ignore this email.',
    ],
    ctaLabel: 'Reset password',
    ctaUrl: resetUrl,
  });
}
