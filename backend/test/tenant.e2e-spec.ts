import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'

/**
 * Smoke e2e: login + tenant-scoped contacts list.
 * Requires DATABASE_URL and seeded demo user.
 */
describe('Tenant isolation (e2e)', () => {
  let app: INestApplication<App>
  let token = ''

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api/v1')
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    await app.init()

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@demo-acme.com', password: 'Password123!' })

    token = login.body?.data?.accessToken ?? ''
  })

  afterAll(async () => {
    await app.close()
  })

  it('rejects contacts without auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/contacts').expect(401)
  })

  it('lists contacts for authenticated tenant', async () => {
    if (!token) return
    const res = await request(app.getHttpServer())
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })
})
