function ControlWeb() {
    this.mostrarAgregarUsuario = function() {
        // Construye el HTML del formulario como una cadena
        let cadena = '';
        cadena += '<div class="form-group" id="mAU">';
        cadena += '  <label for="nick">Name:</label>';
        cadena += '  <input type="text" class="form-control" id="nick" placeholder="Introduce tu nick">';
        cadena += '  <button id="btnAU" type="button" class="btn btn-primary mt-2">Entrar</button>';
        cadena += '</div>';

        // Inserta el formulario en el div con id 'au'
        $("#au").html(cadena);

        // Asocia el evento click al botón
        $("#btnAU").on("click", function() {
            let nick = $("#nick").val();
            rest.agregarUsuario(nick);
            // Elimina el formulario tras hacer click
            $("#mAU").remove();
        });
    };
    this.mostrarObtenerUsuarios = function() {
    let cadena = '';
    cadena += '<div class="form-group" id="mOU">';
    cadena += '  <button id="btnOU" type="button" class="btn btn-info mt-2">Mostrar usuarios</button>';
    cadena += '  <div id="listaUsuarios" class="mt-2"></div>';
    cadena += '</div>';
    $("#au").html(cadena);
    $("#btnOU").on("click", function() {
        rest.obtenerUsuarios();
        // Puedes modificar ClienteRest.obtenerUsuarios para que imprima en #listaUsuarios
    });
};
}