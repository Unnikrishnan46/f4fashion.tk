var table_row = document.querySelectorAll("tbody>tr");
for(i in table_row){
    let n=parseInt(i)+1;
    var th = table_row[i].children[0];
    th.innerHTML=n;
}



function addToCart(proId) {
    console.log('add to cart working')
    console.log(proId)
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            }
        }
    })
}

function addToWish(proId) {
    console.log("add to wish working")
    console.log(proId)
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: "get",
        success: (response) => {
            if (response.status) {
                let count = $('#wish-count').html()
                count = parseInt(count) + 1
                $('#wish-count').html(count)
            }
        }
    })
}



