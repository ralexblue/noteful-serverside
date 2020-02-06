const folderService={
    getAllFolders(knex){
        return knex.select('*').from('folders')
    },
    addanitem(knex,newitem){
        return knex
        .insert(newitem)
        .into('folders')
        .returning('*')
        .then(rows=>{
            return rows[0]
        })
    },
    getById(knex,id){
        return knex.from('folders').select('*').where('id',id).first()
    },
    deleteanitem(knex,id){
        return knex('folders')
        .where({id})
        .delete()
    },
    updateitem(knex,id,newupdatefield){
        return knex('folders')
        .where({id})
        .update(newupdatefield)
    }
}

module.exports=folderService;