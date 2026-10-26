import {
  BillingPlan,
  BillingStatus,
  DealStage,
  MembershipRole,
  PlatformRole,
  PrismaClient,
  TaskPriority,
  TaskStatus,
  TicketChannel,
  TicketPriority,
  TicketStatus,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { permissionsForRole } from '../src/common/permissions/permissions'

const prisma = new PrismaClient()

const ids = {
  companyNorthwind: '00000000-0000-4000-8000-000000000001',
  contactAlice: '00000000-0000-4000-8000-000000000002',
  companyQuartz: '00000000-0000-4000-8000-000000000011',
  companyCircooles: '00000000-0000-4000-8000-000000000012',
  companyVelocity: '00000000-0000-4000-8000-000000000013',
  companyCatalog: '00000000-0000-4000-8000-000000000014',
  contactPhoenix: '00000000-0000-4000-8000-000000000021',
  contactOlivia: '00000000-0000-4000-8000-000000000022',
  contactCandice: '00000000-0000-4000-8000-000000000023',
  contactLana: '00000000-0000-4000-8000-000000000024',
  contactDemi: '00000000-0000-4000-8000-000000000025',
  contactNatali: '00000000-0000-4000-8000-000000000026',
  contactDrew: '00000000-0000-4000-8000-000000000027',
  contactOrlando: '00000000-0000-4000-8000-000000000028',
  leadMaya: '00000000-0000-4000-8000-000000000031',
  leadJon: '00000000-0000-4000-8000-000000000032',
  leadPriya: '00000000-0000-4000-8000-000000000033',
  leadNoah: '00000000-0000-4000-8000-000000000034',
  leadSofia: '00000000-0000-4000-8000-000000000035',
  dealEnterprise: '00000000-0000-4000-8000-000000000041',
  dealMigration: '00000000-0000-4000-8000-000000000042',
  dealRenewal: '00000000-0000-4000-8000-000000000043',
  dealGrowth: '00000000-0000-4000-8000-000000000044',
  dealWholesale: '00000000-0000-4000-8000-000000000045',
  taskPipeline: '00000000-0000-4000-8000-000000000051',
  taskFollowUp: '00000000-0000-4000-8000-000000000052',
  taskProposal: '00000000-0000-4000-8000-000000000053',
  taskRenewal: '00000000-0000-4000-8000-000000000054',
  taskForecast: '00000000-0000-4000-8000-000000000055',
}

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12)

  const org = await prisma.organization.upsert({
    where: { slug: 'demo-acme' },
    update: { name: 'Demo Acme', deletedAt: null },
    create: { name: 'Demo Acme', slug: 'demo-acme' },
  })

  await prisma.organizationBilling.upsert({
    where: { organizationId: org.id },
    update: {
      plan: BillingPlan.GROWTH,
      status: BillingStatus.ACTIVE,
      seatLimit: 50,
      contactLimit: 50_000,
    },
    create: {
      organizationId: org.id,
      plan: BillingPlan.GROWTH,
      status: BillingStatus.ACTIVE,
      seatLimit: 50,
      contactLimit: 50_000,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo-acme.com' },
    update: {
      firstName: 'Ada',
      lastName: 'Admin',
      passwordHash,
      platformRole: PlatformRole.NONE,
      deletedAt: null,
    },
    create: {
      email: 'admin@demo-acme.com',
      firstName: 'Ada',
      lastName: 'Admin',
      passwordHash,
      platformRole: PlatformRole.NONE,
    },
  })

  const platform = await prisma.user.upsert({
    where: { email: 'platform@northstar.local' },
    update: {
      passwordHash,
      platformRole: PlatformRole.PLATFORM_ADMIN,
      deletedAt: null,
    },
    create: {
      email: 'platform@northstar.local',
      firstName: 'Platform',
      lastName: 'Admin',
      passwordHash,
      platformRole: PlatformRole.PLATFORM_ADMIN,
    },
  })

  await prisma.membership.upsert({
    where: {
      organizationId_userId: { organizationId: org.id, userId: admin.id },
    },
    update: {
      role: MembershipRole.ORG_ADMIN,
      permissions: permissionsForRole(MembershipRole.ORG_ADMIN),
      deletedAt: null,
    },
    create: {
      organizationId: org.id,
      userId: admin.id,
      role: MembershipRole.ORG_ADMIN,
      permissions: permissionsForRole(MembershipRole.ORG_ADMIN),
    },
  })

  await prisma.membership.upsert({
    where: {
      organizationId_userId: { organizationId: org.id, userId: platform.id },
    },
    update: {
      role: MembershipRole.ORG_ADMIN,
      permissions: permissionsForRole(MembershipRole.ORG_ADMIN),
      deletedAt: null,
    },
    create: {
      organizationId: org.id,
      userId: platform.id,
      role: MembershipRole.ORG_ADMIN,
      permissions: permissionsForRole(MembershipRole.ORG_ADMIN),
    },
  })

  const companies = [
    {
      id: ids.companyNorthwind,
      name: 'Northwind Traders',
      domain: 'northwind.example',
      industry: 'Wholesale',
      size: '201–500',
      location: 'Chicago, IL',
      revenue: '$18.4m',
      website: 'https://northwind.example',
      ownerName: 'AR',
    },
    {
      id: ids.companyQuartz,
      name: 'Quartz & Co.',
      domain: 'quartz.co',
      industry: 'SaaS',
      size: '51–200',
      location: 'New York, NY',
      revenue: '$12.4m',
      website: 'https://quartz.co',
      ownerName: 'AR',
    },
    {
      id: ids.companyCircooles,
      name: 'Circooles',
      domain: 'circooles.com',
      industry: 'Professional services',
      size: '11–50',
      location: 'Chicago, IL',
      revenue: '$4.1m',
      website: 'https://circooles.com',
      ownerName: 'SL',
    },
    {
      id: ids.companyVelocity,
      name: 'Velocity',
      domain: 'velocity.co',
      industry: 'Fintech',
      size: '51–200',
      location: 'London, UK',
      revenue: '$8.9m',
      website: 'https://velocity.co',
      ownerName: 'MK',
    },
    {
      id: ids.companyCatalog,
      name: 'Catalog',
      domain: 'catalog.com',
      industry: 'Retail technology',
      size: '11–50',
      location: 'Austin, TX',
      revenue: '$8.6m',
      website: 'https://catalog.com',
      ownerName: 'JC',
    },
  ] as const

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: { ...company, organizationId: org.id, deletedAt: null },
      create: {
        ...company,
        organizationId: org.id,
        createdById: admin.id,
      },
    })
  }

  const contacts = [
    {
      id: ids.contactAlice,
      companyId: ids.companyNorthwind,
      firstName: 'Alice',
      lastName: 'Buyer',
      email: 'alice@northwind.example',
      title: 'VP Purchasing',
      stage: 'Qualified',
      ownerName: 'AR',
      phone: '+1 312 555 0101',
      tags: ['priority', 'wholesale'],
    },
    {
      id: ids.contactPhoenix,
      companyId: ids.companyCatalog,
      firstName: 'Phoenix',
      lastName: 'Baker',
      email: 'phoenix@catalog.com',
      title: 'VP of Revenue',
      stage: 'Customer',
      ownerName: 'JC',
      phone: '+1 415 555 0191',
      tags: ['Enterprise', 'Champion'],
    },
    {
      id: ids.contactOlivia,
      companyId: ids.companyQuartz,
      firstName: 'Olivia',
      lastName: 'Rhye',
      email: 'olivia@quartz.co',
      title: 'Head of Sales',
      stage: 'Customer',
      ownerName: 'AR',
      phone: '+1 212 555 0182',
      tags: ['Priority'],
    },
    {
      id: ids.contactCandice,
      companyId: ids.companyCircooles,
      firstName: 'Candice',
      lastName: 'Wu',
      email: 'candice@circooles.com',
      title: 'COO',
      stage: 'Opportunity',
      ownerName: 'SL',
      phone: '+1 312 555 0178',
      tags: ['Inbound'],
    },
    {
      id: ids.contactLana,
      companyId: ids.companyVelocity,
      firstName: 'Lana',
      lastName: 'Steiner',
      email: 'lana@velocity.co',
      title: 'CFO',
      stage: 'Lead',
      ownerName: 'MK',
      phone: '+44 20 7946 0101',
      tags: ['Fintech'],
    },
    {
      id: ids.contactDemi,
      companyId: ids.companyQuartz,
      firstName: 'Demi',
      lastName: 'Wilkinson',
      email: 'demi@quartz.co',
      title: 'Procurement Lead',
      stage: 'Qualified',
      ownerName: 'AR',
      phone: '+1 212 555 0144',
      tags: ['Expansion'],
    },
    {
      id: ids.contactNatali,
      companyId: ids.companyCatalog,
      firstName: 'Natali',
      lastName: 'Craig',
      email: 'natali@catalog.com',
      title: 'RevOps Manager',
      stage: 'Customer',
      ownerName: 'JC',
      phone: '+1 512 555 0166',
      tags: ['Champion'],
    },
    {
      id: ids.contactDrew,
      companyId: ids.companyCircooles,
      firstName: 'Drew',
      lastName: 'Cano',
      email: 'drew@circooles.com',
      title: 'Account Executive',
      stage: 'Lead',
      ownerName: 'SL',
      phone: '+1 312 555 0199',
      tags: ['New'],
    },
    {
      id: ids.contactOrlando,
      companyId: ids.companyVelocity,
      firstName: 'Orlando',
      lastName: 'Diggs',
      email: 'orlando@velocity.co',
      title: 'Director of Ops',
      stage: 'Opportunity',
      ownerName: 'MK',
      phone: '+44 20 7946 0199',
      tags: ['Priority'],
    },
  ] as const

  for (const contact of contacts) {
    const tags = [...contact.tags]
    await prisma.contact.upsert({
      where: { id: contact.id },
      update: { ...contact, tags, organizationId: org.id, deletedAt: null },
      create: {
        ...contact,
        tags,
        organizationId: org.id,
        createdById: admin.id,
      },
    })
  }

  const leads = [
    {
      id: ids.leadMaya,
      firstName: 'Maya',
      lastName: 'Patel',
      email: 'maya@vertex.ai',
      phone: '+1 415 555 0142',
      companyName: 'Vertex AI',
      source: 'Website',
      score: 92,
      status: 'Hot',
      ownerName: 'AR',
    },
    {
      id: ids.leadJon,
      firstName: 'Jon',
      lastName: 'Bell',
      email: 'jon@brightline.com',
      phone: '+1 212 555 0187',
      companyName: 'Brightline',
      source: 'Referral',
      score: 78,
      status: 'Qualified',
      ownerName: 'JC',
    },
    {
      id: ids.leadPriya,
      firstName: 'Priya',
      lastName: 'Shah',
      email: 'priya@atlasgoods.co',
      phone: '+44 20 7946 0958',
      companyName: 'Atlas Goods',
      source: 'LinkedIn',
      score: 64,
      status: 'Working',
      ownerName: 'MK',
    },
    {
      id: ids.leadNoah,
      firstName: 'Noah',
      lastName: 'Williams',
      email: 'noah@clearpath.io',
      phone: '+1 646 555 0104',
      companyName: 'Clearpath',
      source: 'Event',
      score: 41,
      status: 'New',
      ownerName: 'SL',
    },
    {
      id: ids.leadSofia,
      firstName: 'Sofia',
      lastName: 'Lopez',
      email: 'sofia@lattice.io',
      phone: '+1 628 555 0111',
      companyName: 'Lattice',
      source: 'Outbound',
      score: 71,
      status: 'Working',
      ownerName: 'AR',
    },
  ] as const

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: { ...lead, organizationId: org.id, deletedAt: null },
      create: {
        ...lead,
        organizationId: org.id,
        createdById: admin.id,
      },
    })
  }

  const deals = [
    {
      id: ids.dealEnterprise,
      companyId: ids.companyQuartz,
      contactId: ids.contactOlivia,
      title: 'Enterprise expansion',
      amountCents: 8_400_000,
      stage: DealStage.PROPOSAL,
      probability: 70,
      ownerName: 'AR',
      expectedClose: new Date('2026-11-18'),
    },
    {
      id: ids.dealMigration,
      companyId: ids.companyCatalog,
      contactId: ids.contactPhoenix,
      title: 'Platform migration',
      amountCents: 6_250_000,
      stage: DealStage.QUALIFIED,
      probability: 45,
      ownerName: 'JC',
      expectedClose: new Date('2026-12-02'),
    },
    {
      id: ids.dealRenewal,
      companyId: ids.companyCircooles,
      contactId: ids.contactCandice,
      title: 'Annual renewal',
      amountCents: 4_800_000,
      stage: DealStage.NEGOTIATION,
      probability: 85,
      ownerName: 'SL',
      expectedClose: new Date('2026-10-30'),
    },
    {
      id: ids.dealGrowth,
      companyId: ids.companyVelocity,
      contactId: ids.contactLana,
      title: 'Growth package',
      amountCents: 3_120_000,
      stage: DealStage.LEAD,
      probability: 25,
      ownerName: 'MK',
      expectedClose: new Date('2026-12-16'),
    },
    {
      id: ids.dealWholesale,
      companyId: ids.companyNorthwind,
      contactId: ids.contactAlice,
      title: 'Wholesale rollout',
      amountCents: 5_500_000,
      stage: DealStage.PROPOSAL,
      probability: 55,
      ownerName: 'AR',
      expectedClose: new Date('2026-11-05'),
    },
  ] as const

  for (const deal of deals) {
    await prisma.deal.upsert({
      where: { id: deal.id },
      update: { ...deal, organizationId: org.id, currency: 'USD', deletedAt: null },
      create: {
        ...deal,
        organizationId: org.id,
        currency: 'USD',
        createdById: admin.id,
      },
    })
  }

  const now = Date.now()
  const tasks = [
    {
      id: ids.taskPipeline,
      title: 'Review Q3 enterprise pipeline',
      dueAt: new Date(now + 2 * 60 * 60 * 1000),
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      assigneeName: 'AR',
      recordLabel: 'Pipeline',
      recurring: 'Weekly',
    },
    {
      id: ids.taskFollowUp,
      title: 'Follow up with Northwind Traders',
      dueAt: new Date(now + 6 * 60 * 60 * 1000),
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      assigneeName: 'JC',
      recordLabel: 'Northwind Traders',
    },
    {
      id: ids.taskProposal,
      title: 'Send proposal to Circooles',
      dueAt: new Date(now + 24 * 60 * 60 * 1000),
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      assigneeName: 'SL',
      recordLabel: 'Circooles',
      subtasksDone: 2,
      subtasksTotal: 4,
    },
    {
      id: ids.taskRenewal,
      title: 'Renewal health check',
      dueAt: new Date(now + 4 * 24 * 60 * 60 * 1000),
      priority: TaskPriority.LOW,
      status: TaskStatus.DONE,
      assigneeName: 'MK',
      recordLabel: 'Catalog',
      recurring: 'Monthly',
    },
    {
      id: ids.taskForecast,
      title: 'Prepare weekly forecast',
      dueAt: new Date(now + 30 * 60 * 60 * 1000),
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      assigneeName: 'AR',
      recordLabel: 'Forecast',
    },
  ] as const

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: { ...task, organizationId: org.id, deletedAt: null },
      create: {
        ...task,
        organizationId: org.id,
        createdById: admin.id,
      },
    })
  }

  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id,
        type: 'Email',
        subject: 'Sent proposal to Quartz & Co.',
        actorName: 'AR',
        body: 'Shared enterprise expansion proposal',
      },
      {
        organizationId: org.id,
        type: 'Call',
        subject: 'Discovery call with Catalog',
        actorName: 'JC',
      },
      {
        organizationId: org.id,
        type: 'Meeting',
        subject: 'Renewal review with Circooles',
        actorName: 'SL',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.calendarEvent.createMany({
    data: [
      {
        organizationId: org.id,
        title: 'Demo with Velocity',
        startsAt: new Date(now + 2 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        location: 'Zoom',
      },
      {
        organizationId: org.id,
        title: 'QBR · Northwind Traders',
        startsAt: new Date(now + 5 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        location: 'HQ',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.supportTicket.createMany({
    data: [
      {
        organizationId: org.id,
        number: 'SUP-2001',
        subject: 'Unable to export quarterly report',
        customerName: 'Demi Wilkinson',
        status: TicketStatus.OPEN,
        priority: TicketPriority.URGENT,
        channel: TicketChannel.EMAIL,
        agentName: 'AR',
        slaMinutesLeft: 84,
      },
      {
        organizationId: org.id,
        number: 'SUP-2002',
        subject: 'Invite email not received',
        customerName: 'Jon Bell',
        status: TicketStatus.PENDING,
        priority: TicketPriority.HIGH,
        channel: TicketChannel.CHAT,
        agentName: 'JC',
        slaMinutesLeft: 220,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.knowledgeArticle.createMany({
    data: [
      {
        organizationId: org.id,
        title: 'Getting started with Northstar',
        slug: 'getting-started',
        category: 'Onboarding',
        body: 'Welcome to Northstar CRM.',
        published: true,
      },
      {
        organizationId: org.id,
        title: 'Pipeline stages explained',
        slug: 'pipeline-stages',
        category: 'Sales',
        body: 'How deal stages map to forecasting.',
        published: true,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.product.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Northstar Growth',
        sku: 'NS-GROWTH',
        category: 'Plans',
        priceCents: 120_000,
        currency: 'USD',
        billingPeriod: 'month',
        active: true,
      },
      {
        organizationId: org.id,
        name: 'Northstar Enterprise',
        sku: 'NS-ENT',
        category: 'Plans',
        priceCents: 240_000,
        currency: 'USD',
        billingPeriod: 'month',
        active: true,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.quote.createMany({
    data: [
      {
        organizationId: org.id,
        number: 'Q-1001',
        title: 'Enterprise expansion quote',
        customerName: 'Quartz & Co.',
        amountCents: 8_400_000,
        status: 'SENT' as const,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.invoice.createMany({
    data: [
      {
        organizationId: org.id,
        number: 'INV-9001',
        title: 'Circooles renewal invoice',
        customerName: 'Circooles',
        amountCents: 4_800_000,
        status: 'SENT' as const,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.document.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'MSA · Quartz & Co.',
        fileUrl: '/uploads/msa-quartz.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 240_000,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.emailTemplate.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Welcome to Northstar',
        subject: 'Welcome {{first_name}}',
        body: 'Thanks for joining Northstar.',
        category: 'Onboarding',
      },
      {
        organizationId: org.id,
        name: 'Post-demo follow-up',
        subject: 'Great talking today',
        body: 'Here is a recap of our demo.',
        category: 'Sales',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.emailCampaign.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Q4 nurture',
        status: 'Scheduled',
        subject: 'Ideas for your Q4 pipeline',
        audience: 'MQLs',
        sentCount: 0,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.sequence.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Outbound AE sequence',
        status: 'Active',
        enrolledCount: 12,
        steps: [{ day: 1, channel: 'email' }, { day: 3, channel: 'call' }],
      },
    ],
    skipDuplicates: true,
  })

  await prisma.leadForm.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Demo request',
        status: 'Active',
        submissions: 18,
        embedCode: '<script src="forms.northstar.io/demo.js"></script>',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.automationRule.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Create task on hot lead',
        trigger: 'lead.status=Hot',
        active: true,
        actions: [{ type: 'create_task', title: 'Call hot lead' }],
      },
    ],
    skipDuplicates: true,
  })

  await prisma.assignmentRule.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Round-robin West',
        entityType: 'lead',
        assignTo: 'AR',
        active: true,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.leadScoreRule.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Title contains VP',
        field: 'title',
        operator: 'contains',
        value: 'VP',
        points: 15,
        active: true,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.approvalWorkflow.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Discount > 20%',
        entityType: 'deal',
        active: true,
        steps: [{ role: 'SALES_MANAGER' }],
      },
    ],
    skipDuplicates: true,
  })

  await prisma.workflowLog.createMany({
    data: [
      {
        organizationId: org.id,
        workflowName: 'Create task on hot lead',
        status: 'success',
        message: 'Task created for Maya Patel',
        ranAt: new Date(),
      },
    ],
    skipDuplicates: true,
  })

  await prisma.goal.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Q4 new ARR',
        metric: 'arr',
        targetValue: 500000,
        currentValue: 182000,
        period: 'Q4 2026',
        ownerName: 'AR',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.territory.createMany({
    data: [
      { organizationId: org.id, name: 'North America', region: 'NA', ownerName: 'AR', accountsCount: 28 },
      { organizationId: org.id, name: 'EMEA Enterprise', region: 'EMEA', ownerName: 'JC', accountsCount: 17 },
    ],
    skipDuplicates: true,
  })

  await prisma.subscription.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Catalog Growth',
        customerName: 'Catalog',
        plan: 'Growth',
        status: 'Active',
        mrrCents: 120_000,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.contract.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Quartz MSA',
        customerName: 'Quartz & Co.',
        status: 'Active',
        valueCents: 250_000_00,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.project.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Catalog onboarding',
        status: 'Active',
        ownerName: 'MK',
        progress: 45,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.partner.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'CloudBridge Partners',
        tier: 'Gold',
        status: 'Active',
        contactEmail: 'hello@cloudbridge.example',
        region: 'NA',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.commission.createMany({
    data: [
      {
        organizationId: org.id,
        repName: 'AR',
        period: '2026-10',
        dealTitle: 'Enterprise expansion',
        amountCents: 840_000,
        status: 'Pending',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.survey.createMany({
    data: [
      { organizationId: org.id, name: 'CSAT Q4', status: 'Active', responses: 42 },
    ],
    skipDuplicates: true,
  })

  await prisma.landingPage.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Demo landing',
        slug: 'demo',
        status: 'Published',
        url: 'https://northstar.example/demo',
        visits: 1200,
        conversions: 86,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.event.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Northstar Summit',
        status: 'Upcoming',
        startsAt: new Date('2026-12-01T17:00:00.000Z'),
        location: 'San Francisco',
        attendees: 180,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.integration.createMany({
    data: [
      { organizationId: org.id, name: 'Slack', provider: 'slack', status: 'Connected' },
      { organizationId: org.id, name: 'Gmail', provider: 'gmail', status: 'Disconnected' },
    ],
    skipDuplicates: true,
  })

  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: admin.id,
        text: 'Platform migration needs attention',
        view: 'Deals',
        read: false,
      },
      {
        organizationId: org.id,
        userId: admin.id,
        text: 'New lead assigned · Maya Patel',
        view: 'Leads',
        read: false,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.inboxMessage.createMany({
    data: [
      {
        organizationId: org.id,
        channel: 'email',
        fromName: 'Olivia Rhye',
        fromAddress: 'olivia@quartz.co',
        subject: 'Re: Enterprise expansion',
        body: 'Can we review pricing tomorrow?',
        read: false,
      },
    ],
    skipDuplicates: true,
  })

  await prisma.callLog.createMany({
    data: [
      {
        organizationId: org.id,
        contactName: 'Phoenix Baker',
        phone: '+1 415 555 0191',
        direction: 'outbound',
        durationSec: 420,
        outcome: 'Connected',
        occurredAt: new Date(),
      },
    ],
    skipDuplicates: true,
  })

  await prisma.messagingThread.createMany({
    data: [
      {
        organizationId: org.id,
        channel: 'whatsapp',
        participant: '+1 415 555 0191',
        lastMessage: 'Thanks for the update',
      },
    ],
    skipDuplicates: true,
  })

  await prisma.socialPost.createMany({
    data: [
      {
        organizationId: org.id,
        platform: 'linkedin',
        content: 'Shipping our Q4 CRM release notes',
        status: 'Scheduled',
      },
    ],
    skipDuplicates: true,
  })

  // eslint-disable-next-line no-console
  console.log('Seeded demo-acme CRM + catalog domains from API:')
  // eslint-disable-next-line no-console
  console.log('  org admin: admin@demo-acme.com / Password123!')
  // eslint-disable-next-line no-console
  console.log('  platform:  platform@northstar.local / Password123!')
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
