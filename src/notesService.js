const notesService={
    getAllnotes(knex){
        return knex.select('*').from('notes')
    },
    addanitem(knex,newitem){
        return knex
        .insert(newitem)
        .into('notes')
        .returning('*')
        .then(rows=>{
            return rows[0]
        })
    },
    getById(knex,id){
        return knex.from('notes').select('*').where('id',id).first()
    },
    deleteanitem(knex,id){
        return knex('notes')
        .where({id})
        .delete()
    },
    updateitem(knex,id,newupdatefield){
        return knex('notes')
        .where({id})
        .update(newupdatefield)
    }
}

module.exports=notesService;