const request = require('supertest')
const baseUrl = 'http://localhost:3000'

let authToken = ''

describe('Register new user', () => {
  let mutation = (password = '12345678') => `
    mutation {
      registerUser (email: "5oussama@thepieter.com", name: "test user", password: "${password}") {
        name
        email
      }
    }
  `
  test('Return error when sending a short password', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: mutation('12345')
      })
    expect(body.errors[0] && body.errors[0].message).toBe(
      'Senha muito curta (Min. 8 caracteres)'
    )
  })
  test('Sending valid credentials', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: mutation()
      })
    expect(body.data).toEqual({
      registerUser: {
        name: 'test user',
        email: '5oussama@thepieter.com'
      }
    })
  })
  test('Return error when registering a existing email', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: mutation()
      })
    expect(body.errors[0] && body.errors[0].message).toBe(
      'Este email já está em uso'
    )
  })
})

describe('Sign in a user', () => {
  let query = (email = '5oussama@thepieter.com', password = '12345678') => `
    query {
      login(email: "${email}", password: "${password}") {
        name
        token
        email
        favorites {
          placeId
        }
      }
    }
  `
  test('Sign in with correct email and password', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: query()
      })
    authToken = body.data.login.token
    body.data.login.token = ''
    expect(body.data).toEqual({
      login: {
        email: '5oussama@thepieter.com',
        name: 'test user',
        favorites: [],
        token: ''
      }
    })
  })

  test('Return error when sign in with wrong email', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: query('teste@teste.com')
      })
    expect(body.errors[0] && body.errors[0].message).toBe(
      'Email ou senha incorretos'
    )
  })

  test('Return error when sign in with wrong password', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: query('5oussama@thepieter.com', '1234567')
      })
    expect(body.errors[0] && body.errors[0].message).toBe(
      'Email ou senha incorretos'
    )
  })
})

describe('Fetch places', () => {
  let query = `
  {
    getPlace(place: "estelita", lat: -8.1185972, lng: -34.9027497, radius: 25) {
      id
      name
    }
  }
  `
  test('Get nearby places', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: query
      })
    expect(body.data).toEqual({
      getPlace: [
        {
          id: 'ChIJ8xkFgjEfqwcRi1JAqx_0GrI',
          name: 'Estelita Bar'
        },
        {
          id: 'ChIJsYvef7UfqwcRsHGOQBA4vFs',
          name: 'Quintal Estelita'
        },
        {
          id: 'ChIJZajMmzQfqwcR9DsQBXgi3lk',
          name: 'Edifício Mirante Do Cais'
        },
        {
          id: 'ChIJCa8_TTUfqwcRv86YsMV0Dy8',
          name: 'Ocupa Estelita'
        },
        {
          id: 'ChIJE2JXsfsYqwcRTluujCR0yY8',
          name: 'Bodega Estelita do Futuro'
        }
      ]
    })
  })
})

describe('Handle avaliations', () => {
  test('Get avaliations of a place', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: `
          {
            getAvaliations(placeId: "ChIJ8xkFgjEfqwcRi1JAqx_0GrI") {
              name
              placeId
            }
          }
        `
      })
    expect(body.data).toEqual({
      getAvaliations: []
    })
  })
  const query = `
    mutation {
      addAvaliation(
        placeId: "ChIJ8xkFgjEfqwcRi1JAqx_0GrI",
        userEmail: "5oussama@thepieter.com",
        rating: 5,
        comment: "Very good place"
      )
    }
  `
  test('Return error when avaliating without a valid session', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: query
      })
    expect(body.errors[0] && body.errors[0].message).toBe('Sessão inválida')
  })
  test('Add avaliation to a place', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: query
      })
    expect(body.data).toEqual({ addAvaliation: 'Avaliação criada' })
  })
  test('Returns error when a place has already been avaliated', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: query
      })
    expect(body.errors[0] && body.errors[0].message).toBe(
      'Você já avaliou este lugar'
    )
  })
})

describe('Set favorites places', () => {
  const query = `
    mutation {
      setFavorite (
        placeId: "ChIJ8xkFgjEfqwcRi1JAqx_0GrI",
        placeName: "Estelita Bar",
        placeIcon: "https://maps.gstatic.com/mapfiles/place_api/icons/bar-71.png"
      )
    } 
  `
  test('Return error when avaliating without a valid session', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: query
      })
    expect(body.errors[0] && body.errors[0].message).toBe('Sessão inválida')
  })
  test('Add a favorite place', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: query
      })
    expect(body.data).toEqual({
      setFavorite: 'Favorito adicionado'
    })
  })
  test('Remove a favorite place', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: query
      })
    expect(body.data).toEqual({
      setFavorite: 'Favorito removido'
    })
  })
})

describe('Edit user profile', () => {
  const query = `
    mutation {
      changeName (name: "test user change") {
        name
      }
    } 
  `
  test('Return error when changing name without a valid session', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .send({
        query: query
      })
    expect(body.errors[0] && body.errors[0].message).toBe('Sessão inválida')
  })
  test('Change user name', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: query
      })
    expect(body.data).toEqual({
      changeName: {
        name: 'test user change'
      }
    })
  })
  const query2 = `
    mutation {
      changePassword (password: "", newPassword: "")
    }
  `
  test('Request a passoword change', async () => {
    const { body } = await request(baseUrl)
      .post('/graphql')
      .set('Authorization', 'Bearer ' + authToken)
      .send({
        query: `
          mutation {
            changePasswordRequest
          }
        `
      })
    expect(body.data).toEqual({
      changePasswordRequest: 'Acesse seu email para continuar'
    })
  })
})
