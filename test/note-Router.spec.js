const app = require('../src/app')
const knex=require('knex')
const {TEST_DATABASE_URL}= require('../src/config')


describe('notes endpoint',()=>{
    let db;
    let testFolders=[{id:1,title:"1st"},{id:2,title:"2nd"},{id:3,title:"3rd"}]
    let testNotes=[{id:1,author:"me",content:"text",folder:1},{id:2,author:"me2",content:"text2",folder:1},{id:3,author:"me3",content:"text3",folder:2},{id:4,author:"me4",content:"text4",folder:3},]

    before(()=>{
        db=knex({
            client:'pg',
            connection:TEST_DATABASE_URL,
        })
        app.set('db',db)
    })


    before(()=> db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));

    afterEach(()=>db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'))

    after(()=>db.destroy())

    describe('get request',()=>{
        context('given no data in db',()=>{
            it('GET /noteful responds with 200 and empty array',()=>{
                return supertest(app)
                .get('/api/notes')
                .expect(200,[])
            })
        })
        context('given folders are in db',()=>{
            beforeEach('insert test folder data',()=>{
                return db.into('folders').insert(testFolders)
            })
            describe('GET /api/folders',()=>{
                it('responds with 200 and all folder',()=>{
                    return supertest(app).get('/api/folders').expect(200,testFolders)
                })
            })
        })
        context('given notes and folders data in db',()=>{
            beforeEach('insert test folder data',()=>{
                return db.into('folders').insert(testFolders)
                .then(()=>db.into('notes').insert(testNotes))
            })
            describe('GET /api/notes',()=>{
                it("responds with 200 and all notes",()=>{
                    return supertest(app).get('/api/notes').expect(200,testNotes);
                })
            })
        })
    })
    describe('Post request',()=>{
        it('responds with 400 when no title for folder',()=>{
            const nothing ={title:null}
            return supertest(app)
            .post('/api/folders')
            .send(nothing)
            .expect(400,{})
        })
        it('responds with 200 and added a folder',()=>{
            const folderToInsert={
                title:'something'
            }
            return supertest(app)
            .post('/api/folders')
            .send(folderToInsert)
            .expect(201)
            .expect(res=>{
                expect(res.body.title).to.eql(folderToInsert.title)
                expect(res.body).to.have.property('id')
                expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`)
            })
            .then(res=>{
                supertest(app)
                .get(`/api/folders/${res.body.id}`)
                .expect(res.body)
            })
        })
        context('folders is already in db',()=>{
            beforeEach('insert test folder data',()=>{
                return db.into('folders').insert(testFolders)
            })
            describe('post /api/Notes',()=>{
                it('responds with 400 and nothing if no note params',()=>{
                    const notenothing ={author:null,content:null,folder:1}
                    return supertest(app)
                    .post('/api/notes')
                    .send(notenothing)
                    .expect(400,{
                        error: {
                            message: "Missing 'author' in request body"
                        }
                    })
                })
            })
            describe('post notes',()=>{
                it('responds with 201 and added a note',()=>{
                    const noteToInsert={
                        author:'something1',
                        content:'somthing is cool',
                        folder:1,
                    }
                    return supertest(app)
                    .post('/api/notes')
                    .send(noteToInsert)
                    .expect(201)
                    .expect(res=>{
                        expect(res.body.author).to.eql(noteToInsert.author)
                        expect(res.body.content).to.eql(noteToInsert.content)
                        expect(res.body.folder).to.eql(noteToInsert.folder)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/notes/${res.body.id}`)
                    })
                    .then(res=>{
                        supertest(app)
                        .get(`/api/notes/${res.body.id}`)
                        .expect(res.body)
                    })
                })
            })
        })
    })
    describe('Delete requests',()=>{
        it('responds with 404 when no title to delete for folder',()=>{
            const nothingId = 123456;
            return supertest(app)
            .delete(`/api/folders/${nothingId}`)
            .expect(404,{ error: { message: `Folder Not Found` }})
        })
        context('given there are folders in the database to delete',()=>{
            beforeEach('insert test folder data and notes data',()=>{
                return db.into('folders').insert(testFolders)
                .then(()=>db.into('notes').insert(testNotes))

            })
            //describe('Delete a folder',()=>{
                it('will delete a folder',()=>{
                    const folderidToDelete = 1;
                    const expectedFolders = testFolders.filter(folder=>folder.id!==folderidToDelete);
                    //console.log(expectedFolders);
                    return supertest(app)
                    .delete(`/api/folders/${folderidToDelete}`)
                    .expect(204)
                    .then(res=>{
                        supertest(app)
                        .get('/api/folders')
                        .expect(expectedFolders)
                    })
                })
            //})

            //describe('Delete a note in a folder',()=>{
                it('will delete a note',()=>{
                    const noteidToDelete = 3;
                    const expectedNotes = testNotes.filter(note=>note.id!==noteidToDelete);
                    return supertest(app)
                    .delete(`/api/notes/${noteidToDelete}`)
                    .expect(204)
                    .then(res=>{
                        supertest(app)
                        .get('/api/notes')
                        .expect(expectedNotes)
                    })
                })
            //})
        })
    })
    describe('Patch requests',()=>{
        it('responds with 404 when no folders',()=>{
            const nothingId = 123456;
            return supertest(app)
            .delete(`/api/folders/${nothingId}`)
            .expect(404,{ error: { message: `Folder Not Found` }})
        })
        it('responds with 404 when no notes',()=>{
            const nothingId = 123456;
            return supertest(app)
            .delete(`/api/notes/${nothingId}`)
            .expect(404,{ error: { message: `Note Not Found` }})
        })
        context('given there is data to change',()=>{
            beforeEach('insert test folder data and notes data',()=>{
                return db.into('folders').insert(testFolders)
                .then(()=>db.into('notes').insert(testNotes))
            })
            //describe('update a folder',()=>{
                it('will update a folder',()=>{
                    const folderidToUpdate = 1;
                    const updateFolder = {title:"New title"};
                    const expectedFolders={
                        ...testFolders[folderidToUpdate-1],
                        ...updateFolder
                    }
                    return supertest(app)
                    .patch(`/api/folders/${folderidToUpdate}`)
                    .expect(204)
                    .then(res=>{
                        supertest(app)
                        .get(`/api/folders/${folderidToUpdate}`)
                        .expect(expectedFolders)
                    })
                })
           // })

            //describe('update a note in a folder',()=>{
                it('will update a note',()=>{
                    const noteidToUpdate = 1;
                    const updateNote = {author:"New title",content:"new content",folder:2};
                    const expectedNotes={
                        ...testNotes[noteidToUpdate-1],
                        ...updateNote
                    }
                    return supertest(app)
                    .patch(`/api/notes/${noteidToUpdate}`)
                    .expect(204)
                    .then(res=>{
                        supertest(app)
                        .get('/api/notes')
                        .expect(expectedNotes)
                    })
                })
            //})
        })
    })
})